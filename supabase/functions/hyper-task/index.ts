import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

import { decode as base64Decode } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {

  'Access-Control-Allow-Origin': '*',

  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'

};

// Helper: Always return JSON

function jsonResponse(data, status = 200) {

  return new Response(JSON.stringify(data), {

    status,

    headers: {

      ...corsHeaders,

      'Content-Type': 'application/json'

    }

  });

}

// Helper: Extract text from PDF using Gemini File API

async function extractTextFromFile(base64Data, apiKey, mimeType = 'application/pdf', uploadFilename = 'cv.pdf') {

  try {

    // Upload file to Gemini File API

    const fileData = base64Decode(base64Data);

    const blob = new Blob([

      fileData

    ], {

      type: mimeType

    });

    const formData = new FormData();

    formData.append('file', blob, uploadFilename);

    const uploadResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${apiKey}`, {

      method: 'POST',

      body: formData

    });

    if (!uploadResponse.ok) {

      throw new Error('Failed to upload file to Gemini');

    }

    const uploadData = await uploadResponse.json();

    const fileUri = uploadData.file.uri;

    // Extract text using Gemini

    const extractResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {

      method: 'POST',

      headers: {

        'Content-Type': 'application/json'

      },

      body: JSON.stringify({

        contents: [

          {

            parts: [

              {

                fileData: {

                  fileUri,

                  mimeType

                }

              },

              {

                text: 'Extrai todo o texto deste CV em formato plain text. Retorna apenas o texto, sem formatação ou comentários.'

              }

            ]

          }

        ]

      })

    });

    if (!extractResponse.ok) {

      throw new Error('Failed to extract text from PDF');

    }

    const extractData = await extractResponse.json();

    const extractedText = extractData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return extractedText.trim();

  } catch (error) {

    console.error('❌ Erro ao extrair texto do PDF:', error);

    throw error;

  }

}

// Helper: Sanitize and validate CV text

function sanitizeCVText(text) {

  if (!text || typeof text !== 'string') {

    return {

      valid: false,

      sanitized: '',

      error: 'CV text inválido ou vazio'

    };

  }

  let sanitized = text.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '').trim();

  const maxSize = 100 * 1024;

  if (sanitized.length > maxSize) {

    sanitized = sanitized.substring(0, maxSize);

  }

  if (sanitized.length < 50) {

    return {

      valid: false,

      sanitized: '',

      error: 'CV text muito curto (mínimo 50 caracteres)'

    };

  }

  return {

    valid: true,

    sanitized

  };

}

// Helper: Get market context string for EN prompts

function getMarketContext(country, region) {

  if (!country) return 'the international job market';

  if (region) return `the ${region}, ${country} job market`;

  return `the ${country} job market`;

}

// Helper: Get currency for country

function getCurrency(country) {

  const currencyMap = {

    // Europe - EUR

    'Portugal': {

      symbol: '€',

      code: 'EUR'

    },

    'Spain': {

      symbol: '€',

      code: 'EUR'

    },

    'France': {

      symbol: '€',

      code: 'EUR'

    },

    'Germany': {

      symbol: '€',

      code: 'EUR'

    },

    'Italy': {

      symbol: '€',

      code: 'EUR'

    },

    'Netherlands': {

      symbol: '€',

      code: 'EUR'

    },

    'Belgium': {

      symbol: '€',

      code: 'EUR'

    },

    'Ireland': {

      symbol: '€',

      code: 'EUR'

    },

    'Austria': {

      symbol: '€',

      code: 'EUR'

    },

    'Finland': {

      symbol: '€',

      code: 'EUR'

    },

    'Greece': {

      symbol: '€',

      code: 'EUR'

    },

    'Luxembourg': {

      symbol: '€',

      code: 'EUR'

    },

    // Europe - Other

    'United Kingdom': {

      symbol: '£',

      code: 'GBP'

    },

    'Switzerland': {

      symbol: 'CHF',

      code: 'CHF'

    },

    'Sweden': {

      symbol: 'kr',

      code: 'SEK'

    },

    // Americas

    'United States': {

      symbol: '$',

      code: 'USD'

    },

    'Canada': {

      symbol: 'C$',

      code: 'CAD'

    },

    'Brazil': {

      symbol: 'R$',

      code: 'BRL'

    },

    // Asia-Pacific

    'Australia': {

      symbol: 'A$',

      code: 'AUD'

    },

    'Japan': {

      symbol: '¥',

      code: 'JPY'

    },

    'India': {

      symbol: '₹',

      code: 'INR'

    },

    'Singapore': {

      symbol: 'S$',

      code: 'SGD'

    },

    'Macau': {

      symbol: 'MOP$',

      code: 'MOP'

    },

    'Timor-Leste': {

      symbol: '$',

      code: 'USD'

    },

    // Middle East

    'UAE': {

      symbol: 'AED',

      code: 'AED'

    },

    'United Arab Emirates': {

      symbol: 'AED',

      code: 'AED'

    },

    // Africa - Lusophone

    'Angola': {

      symbol: 'Kz',

      code: 'AOA'

    },

    'Mozambique': {

      symbol: 'MT',

      code: 'MZN'

    },

    'Cape Verde': {

      symbol: '$',

      code: 'CVE'

    },

    'Guinea-Bissau': {

      symbol: 'CFA',

      code: 'XOF'

    },

    'São Tomé e Príncipe': {

      symbol: 'Db',

      code: 'STN'

    }

  };

  return currencyMap[country] || {

    symbol: '$',

    code: 'USD'

  };

}

// Helper: Classify market data availability for a country

function getMarketDataLevel(country) {

  const highData = [

    'United States',

    'United Kingdom',

    'Germany',

    'France',

    'Netherlands',

    'Spain',

    'Switzerland',

    'Canada',

    'Australia',

    'Ireland',

    'Portugal',

    'Italy',

    'Sweden',

    'Singapore',

    'India',

    'Brazil',

    'UAE'

  ];

  const mediumData = [

    'Macau',

    'Timor-Leste',

    'Angola',

    'Mozambique',

    'Cape Verde'

  ];

  if (highData.includes(country)) return 'high';

  if (mediumData.includes(country)) return 'medium';

  return 'low';

}

// Helper: Build localisation instruction block for prompts

function getLanguageOutputInstruction(lang) {

  if (lang === 'es') {

    return 'IDIOMA DE SALIDA: Responde íntegramente en Español. Todo el contenido analítico generado por la IA debe estar en español claro, natural y profesional. No respondas en portugués ni en inglés.';

  }

  if (lang === 'en') {

    return 'OUTPUT LANGUAGE: Respond entirely in English. All AI-generated analytical content must be in clear, natural, professional English.';

  }

  return 'LÍNGUA DE OUTPUT: Responde inteiramente em Português de Portugal (PT-PT). Todo o conteúdo analítico gerado pela IA deve estar em PT-PT rigoroso, sem gerúndios brasileiros.';

}

function getLocalisationInstructions(country, region, currency, lang) {

  const dataLevel = getMarketDataLevel(country);

  const marketCtx = getMarketContext(country, region);

  if (lang === 'en') {

    let base = `\nTARGET MARKET: ${marketCtx}\nCURRENCY: ${currency.symbol} (${currency.code})\n`;

    base += `\nLOCALISATION RULES (MANDATORY):\n`;

    base += `1. ALL salary values MUST be in ${currency.symbol} (${currency.code}), realistic for ${marketCtx}.\n`;

    base += `2. "typical_companies" MUST list REAL companies that operate in ${country}${region ? `, specifically in ${region}` : ''}. Include local companies, multinationals with offices there, and sector-relevant employers.\n`;

    base += `3. "formations" and "certifications" MUST prioritise training providers accessible in ${country} — local universities, local training centres, and online platforms available in that market. Include at least 1-2 local/regional institutions if they exist.\n`;

    base += `4. "free_courses" MUST be accessible from ${country}.\n`;

    base += `5. "networking_strategy" MUST have exactly 3 actions, each with exactly 3 "entities" (organizations, events, communities). Each entity MUST include name, type, description (2-3 sentences), website URL (real URL or null), location, and frequency. All entities MUST be relevant to ${country}${region ? ` (${region})` : ''}.\n`;

    if (dataLevel === 'low') {

      base += `6. IMPORTANT: ${country} is a market with LIMITED publicly available salary and career data. If you do not have reliable data for a specific field:\n`;

      base += `   - For salary_range: write "Data not available for ${country} — regional estimate based on [source/reasoning]" and provide your best contextual estimate.\n`;

      base += `   - For companies: list the largest known employers in ${country} and relevant international organisations/NGOs operating there.\n`;

      base += `   - NEVER invent specific salary figures without basis. Contextualise within the regional economic reality.\n`;

    } else if (dataLevel === 'medium') {

      base += `6. NOTE: ${country} has moderate data availability. Provide estimates contextualised to the local economic reality. When uncertain, indicate the estimate is approximate.\n`;

    }

    return base;

  } else {

    let base = `\nMERCADO ALVO: ${marketCtx}\nMOEDA: ${currency.symbol} (${currency.code})\n`;

    base += `\nREGRAS DE LOCALIZAÇÃO (OBRIGATÓRIAS):\n`;

    base += `1. TODOS os valores salariais DEVEM ser em ${currency.symbol} (${currency.code}), realistas para ${marketCtx}.\n`;

    base += `2. "typical_companies" DEVEM listar empresas REAIS que operam em ${country}${region ? `, especificamente em ${region}` : ''}. Incluir empresas locais, multinacionais com escritórios lá, e empregadores relevantes do sector.\n`;

    base += `3. "formations" e "certifications" DEVEM priorizar formadores acessíveis em ${country} — universidades locais, centros de formação locais, e plataformas online disponíveis nesse mercado. Incluir pelo menos 1-2 instituições locais/regionais se existirem.\n`;

    base += `4. "free_courses" DEVEM ser acessíveis a partir de ${country}.\n`;

    base += `5. "networking_strategy" DEVE ter exactamente 3 acções, cada uma com exactamente 3 "entities" (organizações, eventos, comunidades). Cada entidade DEVE incluir name, type, description (2-3 frases), website URL (URL real ou null), location, e frequency. Todas as entidades DEVEM ser relevantes para ${country}${region ? ` (${region})` : ''}.\n`;

    if (dataLevel === 'low') {

      base += `6. IMPORTANTE: ${country} é um mercado com dados salariais e de carreira LIMITADOS publicamente disponíveis. Se não tiveres dados fiáveis para um campo específico:\n`;

      base += `   - Para salary_range: escreve "Dados não disponíveis para ${country} — estimativa regional baseada em [fonte/raciocínio]" e fornece a tua melhor estimativa contextual.\n`;

      base += `   - Para empresas: lista os maiores empregadores conhecidos em ${country} e organizações internacionais/ONGs relevantes que operam lá.\n`;

      base += `   - NUNCA inventes valores salariais específicos sem base. Contextualiza na realidade económica regional.\n`;

    } else if (dataLevel === 'medium') {

      base += `6. NOTA: ${country} tem disponibilidade moderada de dados. Fornece estimativas contextualizadas à realidade económica local. Quando incerto, indica que a estimativa é aproximada.\n`;

    }

    return base;

  }

}

// ─── Gemini Company Enrichment Helper ───────────────────────────────────────



// Request-scoped cache — avoids duplicate Gemini calls for the same company name

// within a single Edge Function invocation

const _companyCache = new Map<string, Promise<any>>();

const _competitorCache = new Map<string, Promise<string[]>>();



// Sanitize company name before prompt interpolation to prevent prompt injection

function sanitizeCompanyName(name: string): string {

  return name.replace(/["\\\n\r`]/g, ' ').trim().substring(0, 100);

}



// Fetch with timeout + exponential backoff retry for transient Gemini errors

async function fetchWithRetry(url: string, options: RequestInit, maxAttempts = 3): Promise<Response> {

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {

    const controller = new AbortController();

    const timeout = setTimeout(() => controller.abort(), 10_000);

    try {

      const res = await fetch(url, { ...options, signal: controller.signal });

      clearTimeout(timeout);

      if (res.ok) return res;

      if ([429, 500, 503].includes(res.status) && attempt < maxAttempts) {

        const wait = Math.pow(2, attempt - 1) * 1000;

        console.warn(`Gemini HTTP ${res.status} on attempt ${attempt}/${maxAttempts}, retrying in ${wait}ms...`);

        await new Promise(r => setTimeout(r, wait));

        continue;

      }

      return res; // non-retryable error — return as-is for caller to handle

    } catch (err: any) {

      clearTimeout(timeout);

      lastError = err;

      if (err.name === 'AbortError') {

        console.warn(`Gemini timeout (10s) on attempt ${attempt}/${maxAttempts}`);

      }

      if (attempt < maxAttempts) {

        await new Promise(r => setTimeout(r, Math.pow(2, attempt - 1) * 1000));

      }

    }

  }

  throw lastError;

}



// Extract text from Gemini response, checking finishReason for incomplete/blocked responses

function extractGeminiText(geminiData: any, context = ''): string | null {

  const candidate = geminiData.candidates?.[0];

  if (!candidate) {

    console.warn(`Gemini: no candidates returned${context ? ` [${context}]` : ''}`);

    return null;

  }

  const finishReason = candidate.finishReason;

  if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {

    console.warn(`Gemini finishReason="${finishReason}"${context ? ` [${context}]` : ''} — skipping output`);

    return null;

  }

  return candidate.content?.parts?.[0]?.text ?? null;

}



// Validate and normalise company details output from Gemini

function normaliseCompanyDetails(data: any, companyName: string): any {

  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const currentYear = new Date().getFullYear();

  let foundedYear: number | null = null;

  if (typeof data.founded_year === 'number' && data.founded_year >= 1600 && data.founded_year <= currentYear) {

    foundedYear = data.founded_year;

  } else if (typeof data.founded_year === 'string' && /^\d{4}$/.test(data.founded_year)) {

    const y = parseInt(data.founded_year, 10);

    if (y >= 1600 && y <= currentYear) foundedYear = y;

  }

  const employeeCount = typeof data.employee_count === 'number' && data.employee_count >= 0

    ? data.employee_count

    : null; // explicit ?? null — avoids 0 being coerced to null by || operator

  const specialties = Array.isArray(data.specialties)

    ? [...new Set(data.specialties.filter((s: any) => typeof s === 'string' && s.trim().length > 0).map((s: string) => s.trim()))]

    : [];

  return {

    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : companyName,

    description: typeof data.description === 'string' ? data.description.trim() : '',

    tagline: typeof data.tagline === 'string' ? data.tagline.trim() : '',

    industry: typeof data.industry === 'string' ? data.industry.trim() : '',

    employee_count: employeeCount,

    company_type: typeof data.company_type === 'string' ? data.company_type.trim() : '',

    founded_year: foundedYear,

    specialties,

    hq: typeof data.hq === 'string' ? data.hq.trim() : '',

  };

}



// Known company name → website mappings for common companies (kept for legacy reference only)

const COMPANY_WEBSITES: Record<string, string> = {

  'deloitte': 'deloitte.com', 'pwc': 'pwc.com', 'ey': 'ey.com', 'kpmg': 'kpmg.com',

  'mckinsey': 'mckinsey.com', 'bcg': 'bcg.com', 'bain': 'bain.com', 'accenture': 'accenture.com',

  'ibm': 'ibm.com', 'google': 'google.com', 'microsoft': 'microsoft.com', 'amazon': 'amazon.com',

  'meta': 'meta.com', 'apple': 'apple.com', 'bnp paribas': 'bnpparibas.com',

  'goldman sachs': 'goldmansachs.com', 'jp morgan': 'jpmorgan.com', 'morgan stanley': 'morganstanley.com',

  'citi': 'citi.com', 'hsbc': 'hsbc.com', 'barclays': 'barclays.com',

  'galp': 'galp.com', 'edp': 'edp.com', 'sonae': 'sonae.pt', 'jerónimo martins': 'jeronimomartins.com',

  'altice': 'altice.pt', 'nos': 'nos.pt', 'vodafone': 'vodafone.com',

  'siemens': 'siemens.com', 'bosch': 'bosch.com', 'continental': 'continental.com',

  'astrazeneca': 'astrazeneca.com', 'novartis': 'novartis.com', 'pfizer': 'pfizer.com', 'roche': 'roche.com',

  'unilever': 'unilever.com', 'nestlé': 'nestle.com', 'nestle': 'nestle.com', "l'oréal": 'loreal.com', 'loreal': 'loreal.com',

  'sap': 'sap.com', 'oracle': 'oracle.com', 'salesforce': 'salesforce.com', 'adobe': 'adobe.com',

  'cisco': 'cisco.com', 'intel': 'intel.com', 'tesla': 'tesla.com', 'uber': 'uber.com',

  'airbnb': 'airbnb.com', 'netflix': 'netflix.com', 'spotify': 'spotify.com',

  'capgemini': 'capgemini.com', 'cognizant': 'cognizant.com', 'infosys': 'infosys.com',

  'wipro': 'wipro.com', 'tcs': 'tcs.com', 'hays': 'hays.com', 'randstad': 'randstad.com',

  'adecco': 'adecco.com', 'michael page': 'michaelpage.com', 'robert half': 'roberthalf.com',

  'share2inspire': 'share2inspire.pt', 'bearing point': 'bearingpoint.com',

  'roland berger': 'rolandberger.com', 'oliver wyman': 'oliverwyman.com',

  // Portuguese companies expanded

  'mota-engil': 'mota-engil.com', 'mota engil': 'mota-engil.com', 'navigator': 'thenavigatorcompany.com',

  'ctt': 'ctt.pt', 'tap': 'flytap.com', 'tap air portugal': 'flytap.com',

  'millennium bcp': 'millenniumbcp.pt', 'bcp': 'millenniumbcp.pt', 'cgd': 'cgd.pt',

  'caixa geral': 'cgd.pt', 'novo banco': 'novobanco.pt', 'bpi': 'bancobpi.pt',

  'santander': 'santander.pt', 'farfetch': 'farfetch.com', 'outsystems': 'outsystems.com',

  'feedzai': 'feedzai.com', 'talkdesk': 'talkdesk.com', 'sword health': 'swordhealth.com',

  'unbabel': 'unbabel.com', 'remote': 'remote.com', 'critical software': 'criticalsoftware.com',

  'novabase': 'novabase.pt', 'primavera bss': 'primaverabss.com', 'primavera': 'primaverabss.com',

  'ren': 'ren.pt', 'brisa': 'brisa.pt', 'vinci': 'vinci.com', 'lidl': 'lidl.pt',

  'auchan': 'auchan.pt', 'pingo doce': 'pingodoce.pt', 'continente': 'continente.pt',

  'worten': 'worten.pt', 'leroy merlin': 'leroymerlin.pt', 'ikea': 'ikea.com',

  'zara': 'zara.com', 'inditex': 'inditex.com', 'h&m': 'hm.com',

  'mercedes': 'mercedes-benz.com', 'bmw': 'bmw.com', 'volkswagen': 'volkswagen.com',

  'autoeuropa': 'volkswagen.pt', 'porsche': 'porsche.com',

  'nos comunicações': 'nos.pt', 'meo': 'meo.pt', 'altice portugal': 'altice.pt',

  'the navigator company': 'thenavigatorcompany.com', 'corticeira amorim': 'amorim.com',

  'amorim': 'amorim.com', 'josé de mello': 'josedemello.pt', 'luz saúde': 'luzsaude.pt',

  'cuf': 'cuf.pt', 'champalimaud': 'fchampalimaud.org',

  'indra': 'indracompany.com', 'everis': 'nttdata.com', 'ntt data': 'nttdata.com',

  'atos': 'atos.net', 'sopra steria': 'soprasteria.com', 'cgi': 'cgi.com',

  'manpower': 'manpowergroup.com', 'manpowergroup': 'manpowergroup.com',

  'mercer': 'mercer.com', 'aon': 'aon.com', 'marsh': 'marsh.com',

  'willis towers watson': 'wtwco.com', 'wtw': 'wtwco.com',

};



async function fetchCompanyDetails(companyName: string): Promise<any> {

  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';

  if (!GEMINI_KEY || !companyName) return null;



  const cacheKey = companyName.toLowerCase().trim();

  if (_companyCache.has(cacheKey)) return _companyCache.get(cacheKey);



  const promise = (async () => {

    try {

      const safeName = sanitizeCompanyName(companyName);

      const prompt = `You are a business intelligence assistant. Return ONLY a valid JSON object (no markdown, no explanation) with factual information about the company "${safeName}".



Use this exact structure:

{

  "name": "Official company name",

  "description": "2-3 sentence company description",

  "tagline": "Company tagline or motto if known, else empty string",

  "industry": "Primary industry (e.g. Technology, Financial Services, Healthcare, Professional Services, etc.)",

  "employee_count": <integer approximate headcount or null if unknown>,

  "company_type": "Public / Private / NGO / Government / etc.",

  "founded_year": <4-digit integer year or null if unknown>,

  "specialties": ["specialty1", "specialty2", "specialty3"],

  "hq": "City, Country"

}



If you do not have reliable information about this company, return null.`;



      const res = await fetchWithRetry(

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,

        {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            contents: [{ role: 'user', parts: [{ text: prompt }] }],

            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }

          })

        }

      );

      if (!res.ok) {

        console.warn(`Gemini company lookup failed for "${companyName}": ${res.status}`);

        return null;

      }

      const geminiData = await res.json();

      const raw = extractGeminiText(geminiData, `company:${companyName}`);

      if (!raw) return null;

      const data = JSON.parse(raw.replace(/```json|```/g, '').trim());

      return normaliseCompanyDetails(data, companyName);

    } catch (err: any) {

      console.warn(`Gemini company enrichment error for "${companyName}":`, err.message);

      return null;

    }

  })();



  _companyCache.set(cacheKey, promise);

  return promise;

}



async function fetchCompetitors(companyName: string): Promise<string[]> {

  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';

  if (!GEMINI_KEY || !companyName) return [];



  const cacheKey = companyName.toLowerCase().trim();

  if (_competitorCache.has(cacheKey)) return _competitorCache.get(cacheKey) ?? [];



  const promise = (async () => {

    try {

      const safeName = sanitizeCompanyName(companyName);

      const prompt = `You are a business intelligence assistant. Return ONLY a valid JSON array (no markdown, no explanation) with the names of up to 5 main competitors of "${safeName}".



Example format: ["Competitor A", "Competitor B", "Competitor C"]



Return an empty array [] if you do not have reliable information.`;



      const res = await fetchWithRetry(

        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,

        {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            contents: [{ role: 'user', parts: [{ text: prompt }] }],

            generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }

          })

        }

      );

      if (!res.ok) {

        console.warn(`Gemini competitors lookup failed for "${companyName}": ${res.status}`);

        return [];

      }

      const geminiData = await res.json();

      const raw = extractGeminiText(geminiData, `competitors:${companyName}`);

      if (!raw) return [];

      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

      return Array.isArray(parsed)

        ? [...new Set(parsed.filter((n: any) => typeof n === 'string' && n.trim().length > 1).map((n: string) => n.trim()))].slice(0, 5)

        : [];

    } catch (err: any) {

      console.warn(`Gemini competitors error for "${companyName}":`, err.message);

      return [];

    }

  })();



  _competitorCache.set(cacheKey, promise);

  return promise;

}



// Single Gemini call returning both company details + competitors.

// Use when both are needed simultaneously (e.g. cover letter) to halve latency.

async function fetchCompanyWithCompetitors(companyName: string): Promise<{ details: any; competitors: string[] }> {

  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';

  if (!GEMINI_KEY || !companyName) return { details: null, competitors: [] };



  const cacheKey = companyName.toLowerCase().trim();

  if (_companyCache.has(cacheKey) && _competitorCache.has(cacheKey)) {

    const [details, competitors] = await Promise.all([

      _companyCache.get(cacheKey),

      _competitorCache.get(cacheKey)

    ]);

    return { details, competitors: competitors ?? [] };

  }



  try {

    const safeName = sanitizeCompanyName(companyName);

    const prompt = `You are a business intelligence assistant. Return ONLY a valid JSON object (no markdown, no explanation) with factual information about the company "${safeName}".



Use this exact structure:

{

  "name": "Official company name",

  "description": "2-3 sentence company description",

  "tagline": "Company tagline or motto if known, else empty string",

  "industry": "Primary industry (e.g. Technology, Financial Services, Healthcare, Professional Services, etc.)",

  "employee_count": <integer approximate headcount or null if unknown>,

  "company_type": "Public / Private / NGO / Government / etc.",

  "founded_year": <4-digit integer year or null if unknown>,

  "specialties": ["specialty1", "specialty2", "specialty3"],

  "hq": "City, Country",

  "competitors": ["Competitor1", "Competitor2", "Competitor3", "Competitor4", "Competitor5"]

}



"competitors": up to 5 main direct competitors by name. Use [] if unknown.

If you do not have reliable information about this company at all, return null.`;



    const res = await fetchWithRetry(

      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          contents: [{ role: 'user', parts: [{ text: prompt }] }],

          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }

        })

      }

    );

    if (!res.ok) {

      console.warn(`Gemini company+competitors lookup failed for "${companyName}": ${res.status}`);

      return { details: null, competitors: [] };

    }

    const geminiData = await res.json();

    const raw = extractGeminiText(geminiData, `company+competitors:${companyName}`);

    if (!raw) return { details: null, competitors: [] };



    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    if (!parsed) return { details: null, competitors: [] };



    const competitors = Array.isArray(parsed.competitors)

      ? [...new Set(parsed.competitors.filter((n: any) => typeof n === 'string' && n.trim().length > 1).map((n: string) => n.trim()))].slice(0, 5)

      : [];

    const details = normaliseCompanyDetails(parsed, companyName);



    // Populate individual caches so subsequent calls don't re-fetch

    if (!_companyCache.has(cacheKey)) _companyCache.set(cacheKey, Promise.resolve(details));

    if (!_competitorCache.has(cacheKey)) _competitorCache.set(cacheKey, Promise.resolve(competitors));



    return { details, competitors };

  } catch (err: any) {

    console.warn(`Gemini company+competitors error for "${companyName}":`, err.message);

    return { details: null, competitors: [] };

  }

}



// Regex-based extraction — fast, no API call.

// Used for short real-time inputs (chat messages) where latency matters.

function extractCompanyNames(text: string): string[] {

  const companies: string[] = [];

  const knownCompanies = /\b(Deloitte|McKinsey|BCG|Bain|KPMG|EY|PwC|Accenture|IBM|Google|Microsoft|Amazon|Meta|Apple|BNP Paribas|Goldman Sachs|JP Morgan|Morgan Stanley|Citi|HSBC|Barclays|Galp|EDP|Sonae|Jer[oó]nimo Martins|Altice|NOS|Vodafone|Siemens|Bosch|Continental|AstraZeneca|Novartis|Pfizer|Roche|Unilever|Nestl[eé]|L'Or[eé]al|SAP|Oracle|Salesforce|Adobe|Cisco|Intel|Tesla|SpaceX|Uber|Airbnb|Netflix|Spotify|Share2Inspire|Capgemini|Atos|Sopra Steria|Indra|Everis|NTT Data|Wipro|TCS|Infosys|HCL|Cognizant|CGI|Bearing ?Point|Roland Berger|Oliver Wyman|A\.T\. ?Kearney|Strategy&|Mercer|Aon|Willis Towers Watson|Hays|Randstad|Adecco|Michael Page|Robert Half|ManpowerGroup|Mota[- ]?Engil|Navigator|CTT|TAP|Millennium BCP|BCP|CGD|Novo Banco|BPI|Santander|Farfetch|OutSystems|Feedzai|Talkdesk|Sword Health|Unbabel|Remote|Critical Software|Novabase|Primavera|REN|Brisa|Lidl|Auchan|Pingo Doce|Continente|Worten|IKEA|Zara|Inditex|Mercedes|BMW|Volkswagen|AutoEuropa|Porsche|MEO|CUF|Luz Sa[uú]de|Corticeira Amorim|Amorim|Marsh|WTW)\b/gi;

  let match;

  while ((match = knownCompanies.exec(text)) !== null) {

    const name = match[1].trim();

    if (!companies.some(c => c.toLowerCase() === name.toLowerCase())) {

      companies.push(name);

    }

  }

  return companies.slice(0, 3);

}



// Gemini-based extraction — understands any employer from full CV text,

// including companies not in the hardcoded regex list.

// Used in enrichWithCompanyData where the input is a full CV and latency is acceptable.

async function extractCompanyNamesWithGemini(cvText: string): Promise<string[]> {

  const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY') || '';

  if (!GEMINI_KEY) return [];

  try {

    const prompt = `Extract up to 3 employer company names from the following CV text. Return ONLY a JSON array of strings with the company names, ordered from most recent to oldest. Return [] if no companies are identified.



CV:

${cvText.substring(0, 3000)}`;



    const res = await fetchWithRetry(

      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`,

      {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          contents: [{ role: 'user', parts: [{ text: prompt }] }],

          generationConfig: { temperature: 0, responseMimeType: 'application/json' }

        })

      }

    );

    if (!res.ok) return [];

    const geminiData = await res.json();

    const raw = extractGeminiText(geminiData, 'extractCompanyNames');

    if (!raw) return [];

    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return Array.isArray(parsed)

      ? parsed.filter((n: any) => typeof n === 'string' && n.trim().length > 1).map((n: string) => n.trim()).slice(0, 3)

      : [];

  } catch {

    return [];

  }

}



async function enrichWithCompanyData(cvText: string, language: string): Promise<string> {

  const companies = await extractCompanyNamesWithGemini(cvText);

  if (companies.length === 0) return '';



  console.log(`Gemini company enrichment: ${companies.length} companies: ${companies.join(', ')}`);



  const isEN = language === 'en';

  const isES = language === 'es';

  // Fetch main company (details + competitors in one call) and all other companies in parallel

  const [mainResult, ...otherResults] = await Promise.allSettled([

    fetchCompanyWithCompetitors(companies[0]),

    ...companies.slice(1).map(name => fetchCompanyDetails(name))

  ]);



  const mainCompany = mainResult.status === 'fulfilled' ? mainResult.value?.details : null;

  const competitors = mainResult.status === 'fulfilled' ? (mainResult.value?.competitors ?? []) : [];

  const otherCompanies = otherResults

    .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)

    .map(r => r.value);



  let context = isEN

    ? '\n\n--- VERIFIED COMPANY DATA (enriched via Gemini) ---\n'

    : isES

      ? '\n\n--- DATOS VERIFICADOS DE EMPRESAS (enriquecidos con Gemini) ---\n'

      : '\n\n--- DADOS VERIFICADOS DAS EMPRESAS (enriquecidos via Gemini) ---\n';



  if (mainCompany) {

    context += isEN ? `\nMOST RECENT EMPLOYER: ${mainCompany.name}\n` : isES ? `\nEMPLEADOR MÁS RECIENTE: ${mainCompany.name}\n` : `\nEMPREGADOR MAIS RECENTE: ${mainCompany.name}\n`;

    if (mainCompany.description) context += `${isEN ? 'Description' : isES ? 'Descripción' : 'Descricao'}: ${mainCompany.description.substring(0, 300)}\n`;

    if (mainCompany.industry) context += `${isEN ? 'Industry' : isES ? 'Industria' : 'Industria'}: ${mainCompany.industry}\n`;

    if (mainCompany.employee_count != null) context += `${isEN ? 'Employees' : isES ? 'Empleados' : 'Funcionarios'}: ${mainCompany.employee_count.toLocaleString()}\n`;

    if (mainCompany.specialties?.length) context += `${isEN ? 'Specialties' : isES ? 'Especialidades' : 'Especialidades'}: ${mainCompany.specialties.join(', ')}\n`;

    if (mainCompany.hq) context += `${isEN ? 'HQ' : isES ? 'Sede' : 'Sede'}: ${mainCompany.hq}\n`;

    if (mainCompany.founded_year) context += `${isEN ? 'Founded' : isES ? 'Fundada' : 'Fundada'}: ${mainCompany.founded_year}\n`;

    if (competitors.length > 0) {

      context += `${isEN ? 'Main competitors' : isES ? 'Principales competidores' : 'Principais concorrentes'}: ${competitors.join(', ')}\n`;

    }

  }



  for (const comp of otherCompanies) {

    context += `\n${isEN ? 'PREVIOUS EMPLOYER' : isES ? 'EMPLEADOR ANTERIOR' : 'EMPREGADOR ANTERIOR'}: ${comp.name}\n`;

    if (comp.industry) context += `${isEN ? 'Industry' : isES ? 'Industria' : 'Industria'}: ${comp.industry}\n`;

    if (comp.employee_count != null) context += `${isEN ? 'Employees' : isES ? 'Empleados' : 'Funcionarios'}: ${comp.employee_count.toLocaleString()}\n`;

    if (comp.specialties?.length) context += `${isEN ? 'Specialties' : isES ? 'Especialidades' : 'Especialidades'}: ${comp.specialties.join(', ')}\n`;

  }



  context += isEN

    ? `\nINSTRUCTIONS FOR USING COMPANY DATA:\n1. CV ANALYSIS: Use company specialties to suggest missing keywords. Reference the industry when evaluating ATS compatibility. Mention competitors when suggesting "typical companies" for the candidate's profile.\n2. CAREER PATH: Use competitors to build the "alternative companies map". Reference company size and industry when suggesting next roles. Include company specialties in development plan recommendations.\n3. LINKEDIN ROAST: Use industry benchmarks to evaluate the profile against sector standards. Reference company specialties when suggesting SEO keywords. Compare with competitor profiles for benchmarking.\n4. GENERAL: Always weave company data naturally into recommendations — never dump raw data. If a company has specific specialties, suggest the candidate highlight matching skills.\n---\n`

    : `\nINSTRUÇÕES PARA USAR OS DADOS DAS EMPRESAS:\n1. ANÁLISE CV: Usa as especialidades da empresa para sugerir keywords em falta. Referencia a indústria ao avaliar compatibilidade ATS. Menciona concorrentes ao sugerir "empresas típicas" para o perfil do candidato.\n2. CAREER PATH: Usa os concorrentes para construir o "mapa de empresas alternativas". Referencia a dimensão e indústria da empresa ao sugerir próximos cargos. Inclui especialidades da empresa nas recomendações do plano de desenvolvimento.\n3. LINKEDIN ROAST: Usa benchmarks da indústria para avaliar o perfil face aos padrões do sector. Referencia especialidades da empresa ao sugerir keywords SEO. Compara com perfis de concorrentes para benchmarking.\n4. GERAL: Integra sempre os dados das empresas de forma natural nas recomendações — nunca despeja dados em bruto. Se uma empresa tem especialidades específicas, sugere que o candidato destaque competências correspondentes.\n---\n`;



  return context;

}



serve(async (req)=>{

  if (req.method === 'OPTIONS') {

    return new Response('ok', {

      headers: corsHeaders

    });

  }

  try {

    let body;

    try {

      body = await req.json();

    } catch (parseError) {

      console.error('❌ Erro ao parsear request body:', parseError);

      return jsonResponse({

        success: false,

        error: 'Request body inválido - JSON malformado'

      }, 400);

    }

    const { mode: rawMode, cv_text, file, filename, message, history } = body;

    const mode = typeof rawMode === 'string' ? rawMode.trim().toLowerCase().replace(/-/g, '_') : rawMode;

    // NEW: Extract language, country, region for internationalisation

    const rawLanguage = String(body.language || body.lang || 'pt').trim().toLowerCase();

    const language = rawLanguage.startsWith('es') ? 'es' : rawLanguage.startsWith('en') ? 'en' : 'pt';

    // NEW: Extract optional job description for CV vs Job matching

    const jobDescription = body.job_description || '';

    const country = body.country || '';

    const region = body.region || '';

    const isPT = language === 'pt' || language === 'PT';

    const isEN = language === 'en';

    const isES = language === 'es';

    const marketCtx = getMarketContext(country, region);

    const currency = getCurrency(country);

    if (!mode || typeof mode !== 'string') {

      return jsonResponse({

        success: false,

        error: 'Parâmetro "mode" obrigatório',

        modes: [

          'cv_builder_parse',

          'cv_analysis',

          'cv_extraction',

          'career_coach',

          'career_path',

          'career_intelligence',

          'linkedin_roast'

        ]

      }, 400);

    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {

      console.error('❌ GEMINI_API_KEY não configurada');

      return jsonResponse({

        success: false,

        error: 'API key não configurada no servidor'

      }, 500);

    }

    // Extract CV text from file, linkedin_url, or use provided cv_text

    let cvText = cv_text;

    const linkedinUrlInput = body.linkedin_url || '';

    // If no cv_text and no file, but linkedin_url is provided, scrape LinkedIn profile via Gemini

    if (!cvText && !file && linkedinUrlInput && linkedinUrlInput.includes('linkedin.com')) {

      console.log('🔗 Extraindo dados do perfil LinkedIn via Gemini:', linkedinUrlInput);

      try {

        const scrapePrompt = `Visit this LinkedIn profile URL and extract ALL professional information as if it were a CV/resume in plain text format.



LinkedIn URL: ${linkedinUrlInput}



Extract and format the following sections (include ALL available information):

- Full Name

- Headline/Title

- Location

- About/Summary section (complete text)

- Experience (all positions with company, title, dates, descriptions)

- Education (all entries with institution, degree, dates)

- Skills & Endorsements

- Certifications

- Languages

- Volunteer Experience

- Publications/Projects (if any)



Return ONLY the extracted text in a clean CV-like format. If you cannot access the profile, return whatever public information is available from the URL.`;

        const scrapeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: scrapePrompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 0.1,

              maxOutputTokens: 8192

            },

            tools: [

              {

                "google_search": {}

              }

            ]

          })

        });

        if (!scrapeResponse.ok) {

          const errText = await scrapeResponse.text();

          console.error('❌ Gemini LinkedIn scrape failed:', errText);

          throw new Error('Failed to extract LinkedIn profile data');

        }

        const scrapeData = await scrapeResponse.json();

        cvText = scrapeData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        console.log(`✅ LinkedIn profile extracted: ${cvText.length} characters`);

        if (!cvText || cvText.length < 50) {

          console.warn('⚠️ LinkedIn scrape returned insufficient data, using URL as context');

          cvText = `LinkedIn Profile URL: ${linkedinUrlInput}\nNote: Could not extract full profile data. The profile may be private or restricted. Please analyze based on any available public information from this URL.`;

        }

      } catch (error) {

        console.error('❌ Erro ao extrair perfil LinkedIn:', error);

        // Instead of failing, use the URL as minimal context

        cvText = `LinkedIn Profile URL: ${linkedinUrlInput}\nNote: Extraction failed (${error.message}). Please analyze based on any available public information from this URL.`;

        console.log('⚠️ Using URL-only fallback for analysis');

      }

    }

    if (!cvText && file) {

      console.log('📄 Extraindo texto do ficheiro...');

      try {

        const lowerFilename = filename?.toLowerCase() || '';

        if (lowerFilename.endsWith('.pdf')) {

          cvText = await extractTextFromFile(file, GEMINI_API_KEY, 'application/pdf', 'cv.pdf');

        } else if (lowerFilename.endsWith('.png')) {

          cvText = await extractTextFromFile(file, GEMINI_API_KEY, 'image/png', 'cv.png');

        } else if (lowerFilename.endsWith('.jpg') || lowerFilename.endsWith('.jpeg')) {

          cvText = await extractTextFromFile(file, GEMINI_API_KEY, 'image/jpeg', 'cv.jpg');

        } else {

          // For DOC/DOCX, decode base64 and try to extract text

          const fileData = base64Decode(file);

          const decoder = new TextDecoder('utf-8');

          cvText = decoder.decode(fileData);

        }

        console.log(`✅ Texto extraído: ${cvText.length} caracteres`);

      } catch (error) {

        console.error('❌ Erro ao extrair texto do ficheiro:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao processar ficheiro',

          details: error.message

        }, 400);

      }

    }

    // MODE: CV Extraction (Free analysis)

    if (mode === 'cv_extraction') {

      const hasJob = jobDescription && jobDescription.trim().length > 3;

      console.log(`🆓 Modo: CV Extraction (Análise Gratuita) [lang=${language}] [job=${hasJob ? 'yes' : 'no'}]`);

      const { valid, sanitized, error } = sanitizeCVText(cvText);

      if (!valid) {

        return jsonResponse({

          success: false,

          error

        }, 400);

      }

      try {

        // Build prompt based on whether job_description is provided

        const jobSection = hasJob ? isEN ? `\n\nJOB POSTING TO MATCH AGAINST:\n${jobDescription.substring(0, 2000)}\n\nIMPORTANT: The "cv_problems" MUST be about gaps between this CV and the job posting above. Also include "job_match" in your JSON response.` : isES ? `\n\nOFERTA DE EMPLEO PARA COMPARAR:\n${jobDescription.substring(0, 2000)}\n\nIMPORTANTE: Los "cv_problems" DEBEN ser sobre brechas entre este CV y la oferta de empleo anterior. Incluye también "job_match" en tu respuesta JSON.` : `\n\nVAGA DE EMPREGO PARA COMPARAR:\n${jobDescription.substring(0, 2000)}\n\nIMPORTANTE: Os "cv_problems" DEVEM ser sobre lacunas entre este CV e a vaga acima. Inclui também "job_match" na resposta JSON.` : '';
        const jobJsonEN = hasJob ? `,"job_match":{"ats_compatibility_score":72,"keyword_gaps":["Skill1","Skill2","Skill3"],"matched_keywords":["Skill1","Skill2"],"job_title":"Detected Job Title","overall_fit":"Brief 1-2 sentence assessment of candidate fit"}` : '';
        const jobJsonES = hasJob ? `,"job_match":{"ats_compatibility_score":72,"keyword_gaps":["Competencia1","Competencia2","Competencia3"],"matched_keywords":["Competencia1","Competencia2"],"job_title":"Título del Puesto Detectado","overall_fit":"Evaluación breve de 1-2 frases sobre la adecuación"}` : '';
        const jobJsonPT = hasJob ? `,"job_match":{"ats_compatibility_score":72,"keyword_gaps":["Competência1","Competência2","Competência3"],"matched_keywords":["Competência1","Competência2"],"job_title":"Título da Função Detetado","overall_fit":"Avaliação breve de 1-2 frases sobre adequação"}` : '';

        const cvProblemsContextEN = hasJob ? 'CRITICAL: "cv_problems" must reference specific gaps between THIS CV and the JOB POSTING. Example: if job requires Python but CV has no Python, that is a problem.' : 'CRITICAL: "cv_problems" must be specific to THIS CV. Reference concrete elements. Never use generic advice.';

        const cvProblemsContextES = hasJob ? 'CRÍTICO: "cv_problems" deben referenciar brechas específicas entre ESTE CV y la OFERTA DE EMPLEO. Ejemplo: si la oferta pide Python pero el CV no tiene Python, eso es un problema.' : 'CRÍTICO: "cv_problems" deben ser específicos para ESTE CV. Referencia elementos concretos. Nunca uses consejos genéricos.';
        const cvProblemsContextPT = hasJob ? 'CRÍTICO: "cv_problems" devem referenciar lacunas específicas entre ESTE CV e a VAGA. Exemplo: se a vaga pede Python mas o CV não tem Python, isso é um problema.' : 'CRÍTICO: "cv_problems" devem ser específicos para ESTE CV. Referencia elementos concretos. Nunca uses conselhos genéricos.';

        const promptEN = `You are a BRUTALLY HONEST senior CV analyst. You score CVs STRICTLY — most CVs score between 35-65. A score above 75 is EXCEPTIONAL and rare. You MUST adapt ALL analysis to the ACTUAL professional field detected in the CV (e.g., physiotherapy, nursing, teaching, engineering, retail — NOT just business/corporate).



SCORING RUBRIC: 0-25 severely deficient, 26-40 below average, 41-55 average, 56-70 good, 71-85 very good, 86-100 exceptional (EXTREMELY RARE). Start from 50 and apply penalties/bonuses.



ANTI-FABRICATION RULES (CRITICAL):

- detected_name: copy EXACTLY as it appears in the CV header. Do NOT guess or invent.

- detected_email / detected_phone: copy exactly as found, or use null if absent.

- All score fields MUST be integers (e.g. 62, not "62" and not "62/100").

- All salary fields MUST be integers in ${currency.code} (e.g. 2500, not "2500" and not "2,500 EUR").

- If a field cannot be reliably determined from the CV, use null. Never fabricate.



OUTPUT LANGUAGE: Respond entirely in English regardless of the CV's original language.



Analyse this CV and return a JSON. ALL text must be in English.



CV:

${sanitized}${jobSection}



${country ? `TARGET MARKET: ${marketCtx}\nCURRENCY: ${currency.symbol} (${currency.code})` : ''}



${cvProblemsContextEN}



SALARY REFERENCE (monthly gross, Portugal baseline — scale proportionally for other markets using TARGET MARKET above):

HEALTHCARE: Physiotherapist 900-2200, Nurse 1100-2400, Doctor 2500-5500

EDUCATION: Teacher 1200-2800, Professor 1800-4500

ENGINEERING: 1200-3500 depending on specialisation

TECHNOLOGY: Software Engineer 1500-4500, Data Analyst 1200-3000

TRADES: 800-1800 depending on specialisation

RETAIL/HOSPITALITY: 800-2000 depending on role

CORPORATE: HR Manager 2000-5000, Marketing Manager 1800-4000



AUTOMATION RISK: Healthcare/Education/Trades = focus on patient care, pedagogy, manual skills (NOT generic leadership). Technology = focus on emerging frameworks. Corporate = leadership and strategy ONLY for actual corporate roles.



NARRATIVE DEPTH RULES (MANDATORY — applied to every text field):

- Write as a senior analyst speaking directly to the professional, not as a form being filled.

- Every text field must read as a crafted sentence, not a bullet fragment or template placeholder.

- Minimum word counts: strengths/improvements items = 25 words each; market_positioning = 60 words; quadrant detailed_feedback = 50 words each; automationRisk description = 60 words; priority_recommendations = 70 words; cv_problems full_explanation = 80 words each.

- Reference the professional's actual role, employers, and career stage in EVERY analytical text field.

- Avoid starting sentences with "This CV", "The candidate", "You should" — vary sentence openers.



Return ONLY this JSON (all score/salary values are integers, not strings):

{

  "candidate_profile": {

    "detected_name": "Exact name from CV header or null",

    "detected_email": "Exact email or null",

    "detected_phone": "Exact phone or null",

    "total_years_exp": "X years — calculated from career start to present",

    "detected_role": "Current or most recent role as written in CV",

    "seniority": "Junior/Mid-level/Senior/Lead/Director",

    "key_skills": ["8-12 specific skills drawn directly from the CV — tools, methodologies, domains, languages. Not generic labels."]

  },

  "global_summary": {

    "strengths": [

      "Strength 1 — 2 sentences minimum. Name a specific strength and explain WHY it matters for this person's market positioning, referencing concrete evidence from the CV (e.g., employer name, project, certification).",

      "Strength 2 — 2 sentences minimum. Same depth.",

      "Strength 3 — 2 sentences minimum. Same depth.",

      "Strength 4 — optional but preferred for senior profiles"

    ],

    "improvements": [

      "Improvement 1 — 2 sentences minimum. Name a specific gap and explain the concrete career impact of NOT addressing it.",

      "Improvement 2 — 2 sentences minimum. Same depth.",

      "Improvement 3 — 2 sentences minimum. Same depth."

    ]

  },

  "executive_summary": {

    "global_score": "<integer 0-100 — STRICT scoring>",

    "market_positioning": "3-4 sentences. Describe how this person is positioned in ${marketCtx}: what type of roles they compete for, against whom, what sets them apart, and where they sit in the market hierarchy. Reference their actual employers and field."

  },

  "quadrants": [

    {

      "title": "Structure",

      "score": "<integer 0-100>",

      "benchmark": "<integer 0-100 — typical for this seniority in this field>",

      "impactPhrase": "One punchy sentence specific to THIS CV's structure — not generic",

      "strengths": ["2-3 specific structural strengths referencing actual CV elements (layout, length, sections present, formatting)"],

      "weaknesses": ["2-3 specific structural weaknesses with concrete examples from this CV"],

      "detailed_feedback": "3-4 sentences. Evaluate structure specifically: does the layout aid readability, is length appropriate for seniority, are sections well-ordered, is there a clear visual hierarchy. Reference specific elements of this CV."

    },

    {

      "title": "Content",

      "score": "<integer>",

      "benchmark": "<integer>",

      "impactPhrase": "One punchy sentence specific to THIS CV's content quality",

      "strengths": ["2-3 specific content strengths — name actual bullet points, achievements or metrics from the CV"],

      "weaknesses": ["2-3 specific content weaknesses — name what is missing or vague in this CV"],

      "detailed_feedback": "3-4 sentences. Evaluate content quality: are achievements quantified, do bullet points show impact or just tasks, is language active, are results demonstrated. Give specific examples from this CV."

    },

    {

      "title": "Education",

      "score": "<integer>",

      "benchmark": "<integer>",

      "impactPhrase": "One punchy sentence specific to THIS CV's education and credentials",

      "strengths": ["2-3 specific education strengths — name actual degrees, certifications, institutions"],

      "weaknesses": ["2-3 specific education weaknesses — what credentials are missing or underpresented for this field"],

      "detailed_feedback": "3-4 sentences. Evaluate education relative to the detected field: is the degree level appropriate, are certifications current and relevant, what credentials would strengthen this profile. Reference actual qualifications from this CV."

    },

    {

      "title": "Experience",

      "score": "<integer>",

      "benchmark": "<integer>",

      "impactPhrase": "One punchy sentence specific to THIS CV's experience profile",

      "strengths": ["2-3 specific experience strengths — name actual employers, roles or progression patterns"],

      "weaknesses": ["2-3 specific experience weaknesses — gaps, short tenures, missing sector exposure, etc."],

      "detailed_feedback": "3-4 sentences. Evaluate experience quality and relevance: career progression logic, employer prestige for the field, tenure patterns, cross-sector breadth vs depth. Reference actual employers and timeline from this CV."

    }

  ],

  "salaryDetailed": {

    "period": "monthly",

    "currency_code": "${currency.code}",

    "currency_symbol": "${currency.symbol}",

    "percentile25": "<integer monthly gross in ${currency.code} — numbers only, e.g. 2200>",

    "median": "<integer monthly gross in ${currency.code}>",

    "percentile75": "<integer monthly gross in ${currency.code}>",

    "topMax": "<integer monthly gross in ${currency.code}>",

    "salary_label": "Monthly gross salary range in ${currency.symbol} for ${marketCtx} — e.g. '${currency.symbol}2,200 – ${currency.symbol}3,500/month gross'",

    "benefits": [

      "Benefit specific to this professional field and seniority level — not generic",

      "Benefit 2 — field-specific",

      "Benefit 3 — field-specific",

      "Benefit 4 — optional"

    ],

    "benefitsNote": "2-3 sentences. Contextualise the benefit package for this specific profile in ${marketCtx}: what is standard, what this person can negotiate given their seniority, and any field-specific perks.",

    "source": "Market estimate for detected role and seniority in ${marketCtx}"

  },

  "automationRisk": {

    "percentage": "<integer 0-100>",

    "level": "Low/Medium/High",

    "description": "3-4 sentences SPECIFIC to THIS role and field. Explain WHICH tasks in this person's actual job are at risk and WHY, which tasks are protected, and what the 5-year outlook looks like for this specific profession. DO NOT use generic statements about AI or automation.",

    "recommendations": [

      "Specific recommendation tied to this person's actual profession and skill set — not generic advice",

      "Recommendation 2 — specific to this field",

      "Recommendation 3 — specific to this field"

    ]

  },

  "priority_recommendations": {

    "immediate_adjustments": "3-4 sentences. The 2-3 most impactful changes this person should make to the CV right now, with specific reference to what exists and what should replace it. Actionable, not generic."

  },

  "cv_problems": [

    {

      "title": "Problem title — specific to this CV",

      "description": "2 sentences: what the problem is and why it matters for this person's job search.",

      "full_explanation": "4-5 sentences: detailed explanation of the problem with specific evidence from the CV, the recruiter's perspective, and the impact on application success.",

      "correction_example": "Before: [exact text or pattern from this CV] → After: [improved version]",

      "rewrite_suggestion": "Ready-to-paste text in the same language as the CV. Max 50 words. Specific to this person's role and experience."

    },

    {

      "title": "Problem 2",

      "description": "2 sentences.",

      "full_explanation": "4-5 sentences.",

      "correction_example": "Before → After",

      "rewrite_suggestion": "Ready text, max 50 words"

    },

    {

      "title": "Problem 3",

      "description": "2 sentences.",

      "full_explanation": "4-5 sentences.",

      "correction_example": "Before → After",

      "rewrite_suggestion": "Ready text, max 50 words"

    }

  ]${jobJsonEN}

}



CRITICAL RULES:

1. global_score MUST be calculated as weighted average: Structure 25% + Content 30% + Education 15% + Experience 30%

2. Dimension scores MUST vary by at least 10 points between highest and lowest

3. ALL benchmark and score values MUST be plain integers (0-100), NOT strings or text

4. Salary MUST be realistic for the detected profession and market — use the reference table above

5. Benefits MUST be specific to the detected professional field

6. Automation risk recommendations MUST be specific to the detected profession

7. A CV with generic descriptions, no metrics, and basic structure should NEVER score above 55

8. NEVER invent contact details — use null if not found in the CV`;

        const promptPT = `És um analista de CVs BRUTALMENTE HONESTO. Pontuas CVs de forma RIGOROSA — a maioria dos CVs pontua entre 35-65. Um score acima de 75 é EXCEPCIONAL e raro. DEVES adaptar TODA a análise à ÁREA PROFISSIONAL REAL detectada no CV (ex: fisioterapia, enfermagem, ensino, engenharia, retalho — NÃO apenas business/corporate).



RUBRICA DE PONTUAÇÃO: 0-25 severamente deficiente, 26-40 abaixo da média, 41-55 médio, 56-70 bom, 71-85 muito bom, 86-100 excepcional (EXTREMAMENTE RARO). Começa em 50 e aplica penalizações/bónus.



REGRAS ANTI-FABRICAÇÃO (CRÍTICO):

- detected_name: copia EXACTAMENTE como aparece no cabeçalho do CV. NÃO adivinhes nem inventes.

- detected_email / detected_phone: copia exactamente como encontrado, ou usa null se ausente.

- Todos os campos de score DEVEM ser inteiros (ex: 62, não "62" nem "62/100").

- Todos os campos salariais DEVEM ser inteiros em ${currency.code} (ex: 2500, não "2500" nem "2.500 EUR").

- Se um campo não puder ser determinado de forma fiável a partir do CV, usa null. Nunca fabricar.



LÍNGUA DE OUTPUT: Responde inteiramente em Português de Portugal (PT-PT), independentemente da língua original do CV.



Analisa este CV e retorna um JSON. Todo o texto deve ser em Português.



CV:

${sanitized}${jobSection}



${country ? `MERCADO ALVO: ${getMarketContext(country, region)}\nMOEDA: ${currency.symbol} (${currency.code})` : ''}



${cvProblemsContextPT}



TABELA SALARIAL DE REFERÊNCIA (mensal bruto, base Portugal — escala proporcionalmente para outros mercados usando o MERCADO ALVO acima):

SAÚDE: Fisioterapeuta 900-2200, Enfermeiro 1100-2400, Médico 2500-5500

EDUCAÇÃO: Professor 1200-2800, Professor Universitário 1800-4500

ENGENHARIA: 1200-3500 dependendo da especialização

TECNOLOGIA: Engenheiro de Software 1500-4500, Analista de Dados 1200-3000

OFÍCIOS: 800-1800 dependendo da especialização

COMÉRCIO/HOTELARIA: 800-2000 dependendo da função

CORPORATE: Gestor de RH 2000-5000, Gestor de Marketing 1800-4000



RISCO DE AUTOMAÇÃO: Saúde/Educação/Ofícios = foca em cuidados ao paciente, pedagogia, competências manuais (NÃO liderança genérica). Tecnologia = foca em frameworks emergentes. Corporate = liderança e estratégia APENAS para funções realmente corporativas.



REGRAS DE PROFUNDIDADE NARRATIVA (OBRIGATÓRIO — aplicadas a todos os campos de texto):

- Escreve como um analista sénior a falar directamente com o profissional, não como um formulário a preencher.

- Cada campo de texto deve ler-se como uma frase elaborada, não como um fragmento de bullet point ou placeholder de template.

- Mínimos de palavras: itens de strengths/improvements = 25 palavras cada; market_positioning = 60 palavras; detailed_feedback de cada quadrante = 50 palavras; descrição de automationRisk = 60 palavras; priority_recommendations = 70 palavras; full_explanation de cv_problems = 80 palavras cada.

- Referencia a função real do profissional, empregadores e estágio de carreira em TODOS os campos de texto analítico.

- Evita começar frases com "Este CV", "O candidato", "Deves" — varia os inícios de frase.



Retorna APENAS este JSON (todos os valores de score/salário são inteiros, não strings):

{

  "candidate_profile": {

    "detected_name": "Nome exacto do cabeçalho do CV ou null",

    "detected_email": "Email exacto ou null",

    "detected_phone": "Telefone exacto ou null",

    "total_years_exp": "X anos — calculado desde o início de carreira até ao presente",

    "detected_role": "Cargo actual ou mais recente tal como escrito no CV",

    "seniority": "Júnior/Pleno/Sénior/Lead/Director",

    "key_skills": ["8-12 competências específicas retiradas directamente do CV — ferramentas, metodologias, domínios, línguas. Não rótulos genéricos."]

  },

  "global_summary": {

    "strengths": [

      "Ponto forte 1 — mínimo 2 frases. Nomeia um ponto forte específico e explica PORQUE importa para o posicionamento de mercado desta pessoa, referenciando evidência concreta do CV (ex: nome de empregador, projecto, certificação).",

      "Ponto forte 2 — mínimo 2 frases. Mesma profundidade.",

      "Ponto forte 3 — mínimo 2 frases. Mesma profundidade.",

      "Ponto forte 4 — opcional mas preferível para perfis seniores"

    ],

    "improvements": [

      "Melhoria 1 — mínimo 2 frases. Nomeia uma lacuna específica e explica o impacto concreto na carreira de NÃO a endereçar.",

      "Melhoria 2 — mínimo 2 frases. Mesma profundidade.",

      "Melhoria 3 — mínimo 2 frases. Mesma profundidade."

    ]

  },

  "executive_summary": {

    "global_score": "<inteiro 0-100 — pontuação RIGOROSA>",

    "market_positioning": "3-4 frases. Descreve como esta pessoa está posicionada em ${getMarketContext(country, region)}: que tipo de funções disputa, contra quem, o que a distingue, e onde se situa na hierarquia de mercado. Referencia os empregadores reais e a área de actuação."

  },

  "quadrants": [

    {

      "title": "Estrutura",

      "score": "<inteiro 0-100>",

      "benchmark": "<inteiro 0-100 — típico para esta senioridade nesta área>",

      "impactPhrase": "Uma frase incisiva específica à estrutura DESTE CV — não genérica",

      "strengths": ["2-3 pontos fortes estruturais específicos referenciando elementos reais do CV (layout, extensão, secções presentes, formatação)"],

      "weaknesses": ["2-3 fraquezas estruturais específicas com exemplos concretos deste CV"],

      "detailed_feedback": "3-4 frases. Avalia a estrutura especificamente: o layout facilita a leitura, a extensão é adequada para a senioridade, as secções estão bem ordenadas, há hierarquia visual clara. Referencia elementos específicos deste CV."

    },

    {

      "title": "Conteúdo",

      "score": "<inteiro>",

      "benchmark": "<inteiro>",

      "impactPhrase": "Uma frase incisiva específica à qualidade do conteúdo DESTE CV",

      "strengths": ["2-3 pontos fortes de conteúdo — nomeia bullet points reais, conquistas ou métricas do CV"],

      "weaknesses": ["2-3 fraquezas de conteúdo — nomeia o que está em falta ou vago neste CV"],

      "detailed_feedback": "3-4 frases. Avalia a qualidade do conteúdo: as conquistas estão quantificadas, os bullet points mostram impacto ou apenas tarefas, a linguagem é activa, os resultados estão demonstrados. Dá exemplos específicos deste CV."

    },

    {

      "title": "Formação",

      "score": "<inteiro>",

      "benchmark": "<inteiro>",

      "impactPhrase": "Uma frase incisiva específica à formação e credenciais DESTE CV",

      "strengths": ["2-3 pontos fortes de formação — nomeia graus reais, certificações, instituições"],

      "weaknesses": ["2-3 fraquezas de formação — que credenciais estão em falta ou sub-representadas para esta área"],

      "detailed_feedback": "3-4 frases. Avalia a formação em relação à área detectada: o nível de grau é adequado, as certificações estão actualizadas e são relevantes, que credenciais fortaleceriam este perfil. Referencia qualificações reais deste CV."

    },

    {

      "title": "Experiência",

      "score": "<inteiro>",

      "benchmark": "<inteiro>",

      "impactPhrase": "Uma frase incisiva específica ao perfil de experiência DESTE CV",

      "strengths": ["2-3 pontos fortes de experiência — nomeia empregadores reais, funções ou padrões de progressão"],

      "weaknesses": ["2-3 fraquezas de experiência — lacunas, tenures curtos, exposição sectorial em falta, etc."],

      "detailed_feedback": "3-4 frases. Avalia a qualidade e relevância da experiência: lógica de progressão de carreira, prestígio dos empregadores para a área, padrões de tenure, amplitude vs profundidade cross-sector. Referencia empregadores reais e timeline deste CV."

    }

  ],

  "salaryDetailed": {

    "period": "mensal",

    "currency_code": "${currency.code}",

    "currency_symbol": "${currency.symbol}",

    "percentile25": "<inteiro bruto mensal em ${currency.code} — apenas números, ex: 2200>",

    "median": "<inteiro bruto mensal em ${currency.code}>",

    "percentile75": "<inteiro bruto mensal em ${currency.code}>",

    "topMax": "<inteiro bruto mensal em ${currency.code}>",

    "salary_label": "Intervalo salarial bruto mensal em ${currency.symbol} para ${getMarketContext(country, region)} — ex: '${currency.symbol}2.200 – ${currency.symbol}3.500/mês bruto'",

    "benefits": [

      "Benefício específico desta área profissional e nível de senioridade — não genérico",

      "Benefício 2 — específico da área",

      "Benefício 3 — específico da área",

      "Benefício 4 — opcional"

    ],

    "benefitsNote": "2-3 frases. Contextualiza o pacote de benefícios para este perfil específico em ${getMarketContext(country, region)}: o que é standard, o que esta pessoa pode negociar dada a senioridade, e perks específicos da área.",

    "source": "Estimativa de mercado para a função e senioridade detectadas em ${getMarketContext(country, region)}"

  },

  "automationRisk": {

    "percentage": "<inteiro 0-100>",

    "level": "Baixo/Médio/Alto",

    "description": "3-4 frases ESPECÍFICAS a ESTA função e área. Explica QUAIS tarefas no trabalho real desta pessoa estão em risco e PORQUÊ, quais estão protegidas, e qual é a perspectiva a 5 anos para esta profissão específica. NÃO usar afirmações genéricas sobre IA ou automação.",

    "recommendations": [

      "Recomendação específica ligada à profissão e competências reais desta pessoa — não conselho genérico",

      "Recomendação 2 — específica desta área",

      "Recomendação 3 — específica desta área"

    ]

  },

  "priority_recommendations": {

    "immediate_adjustments": "3-4 frases. As 2-3 alterações de maior impacto que esta pessoa deve fazer ao CV agora, com referência específica ao que existe e o que deve substituir. Accionável, não genérico."

  },

  "cv_problems": [

    {

      "title": "Título do problema — específico a este CV",

      "description": "2 frases: qual é o problema e porque importa para a candidatura desta pessoa.",

      "full_explanation": "4-5 frases: explicação detalhada do problema com evidência específica do CV, a perspectiva do recrutador, e o impacto no sucesso das candidaturas.",

      "correction_example": "Antes: [texto ou padrão exacto deste CV] → Depois: [versão melhorada]",

      "rewrite_suggestion": "Texto pronto a colar na língua do CV. Máx 50 palavras. Específico à função e experiência desta pessoa."

    },

    {

      "title": "Problema 2",

      "description": "2 frases.",

      "full_explanation": "4-5 frases.",

      "correction_example": "Antes → Depois",

      "rewrite_suggestion": "Texto pronto, máx 50 palavras"

    },

    {

      "title": "Problema 3",

      "description": "2 frases.",

      "full_explanation": "4-5 frases.",

      "correction_example": "Antes → Depois",

      "rewrite_suggestion": "Texto pronto, máx 50 palavras"

    }

  ]${jobJsonPT}

}



REGRAS CRÍTICAS:

1. global_score DEVE ser calculado como média ponderada: Estrutura 25% + Conteúdo 30% + Formação 15% + Experiência 30%

2. Os scores das dimensões DEVEM variar pelo menos 10 pontos entre o mais alto e o mais baixo

3. TODOS os valores de benchmark e score DEVEM ser inteiros simples (0-100), NÃO strings nem texto

4. Salário DEVE ser realista para a profissão e mercado detectados — usa a tabela de referência acima

5. Benefícios DEVEM ser específicos à área profissional detectada

6. Recomendações de risco de automação DEVEM ser específicas à profissão detectada

7. Um CV com descrições genéricas, sem métricas e estrutura básica NUNCA deve pontuar acima de 55

8. NUNCA inventes dados de contacto — usa null se não encontrado no CV`;

                const promptES = `Eres un analista de CVs BRUTALMENTE HONESTO. Puntúas CVs de forma RIGUROSA — la mayoría de los CVs puntúan entre 35-65. Una puntuación superior a 75 es EXCEPCIONAL y rara. DEBES adaptar TODA la analítica al ÁREA PROFESIONAL REAL detectada en el CV (ej: fisioterapia, enfermería, enseñanza, ingeniería, retail — NO solo business/corporate).
RÚBRICA DE PUNTUACIÓN: 0-25 severamente deficiente, 26-40 por debajo de la media, 41-55 medio, 56-70 bueno, 71-85 muy bueno, 86-100 excepcional (EXTREMADAMENTE RARO). Empieza en 50 y aplica penalizaciones/bonificaciones.
REGLAS ANTI-FABRICACIÓN (CRÍTICO):
- detected_name: copia EXACTAMENTE como aparece en el encabezado del CV. NO adivines ni inventes.
- detected_email / detected_phone: copia exactamente como se encuentra, o usa null si está ausente.
- Todos los campos de score DEBEN ser enteros (ej: 62, no "62" ni "62/100").
- Todos los campos salariales DEBEN ser enteros en ${currency.code} (ej: 2500, no "2500" ni "2.500 EUR").
- Si un campo no puede determinarse de forma fiable a partir del CV, usa null. Nunca fabricar.
IDIOMA DE SALIDA: Responde íntegramente en Español.
Analiza este CV y devuelve un JSON. Todo el texto debe estar en Español.
CV:
${sanitized}${jobSection}
${country ? `MERCADO OBJETIVO: ${getMarketContext(country, region)}
MONEDA: ${currency.symbol} (${currency.code})` : ''}
${cvProblemsContextES}
TABLA SALARIAL DE REFERENCIA (mensual bruto, base Portugal — escala proporcionalmente para otros mercados usando el MERCADO OBJETIVO arriba):
SALUD: Fisioterapeuta 900-2200, Enfermero 1100-2400, Médico 2500-5500
EDUCACIÓN: Profesor 1200-2800, Profesor Universitario 1800-4500
INGENIERÍA: 1200-3500 dependiendo de la especialización
TECNOLOGÍA: Ingeniero de Software 1500-4500, Analista de Datos 1200-3000
OFICIOS: 800-1800 dependiendo de la especialización
COMERCIO/RETAIL: Operador de Tienda 820-1100, Gerente de Tienda 1200-2000
CORPORATIVO: Analista 1200-2000, Manager 2000-3500, Director 3500-6000+
REGLAS DE FEEDBACK POR ÁREA:
SALUD: Enfócate en volumen de pacientes, especialidades clínicas, certificaciones, gestión de crisis — NO en "crecimiento de ingresos" o "gestión de stakeholders"
EDUCACIÓN: Enfócate en metodologías de enseñanza, tamaño de clases, desarrollo curricular, resultados de alumnos — NO en "optimización de procesos"
INGENIERÍA: Enfócate en herramientas técnicas, alcance de proyectos, normativas de seguridad, presupuestos gestionados
OFICIOS: Enfócate en certificaciones especializadas, resolución de problemas complejos, experiencia en seguridad, transición energética verde — NO liderazgo de IA y automatización
COMERCIO: Enfócate en experiencia del cliente, visual merchandising, competencias de e-commerce, gestión de inventario — NO liderazgo ejecutivo
TECNOLOGÍA: Enfócate en frameworks emergentes, arquitectura cloud, competencias IA/ML, diseño de sistemas — apropiado al área
CORPORATIVO: Liderazgo, pensamiento estratégico, transformación digital — SOLO para funciones realmente corporativas
KEYWORDS ATS POR ÁREA: Las keywords detectadas y recomendadas DEBEN ser relevantes para el área profesional. Un enfermero necesita "cuidados al paciente, evaluación clínica, administración de medicación" — NO "gestión de stakeholders, ROI, KPIs". Un mecánico necesita "diagnóstico, mantenimiento preventivo, sistemas hidráulicos" — NO "gestión de proyectos, metodología agile". Un fisioterapeuta necesita "rehabilitación, terapia manual, evaluación funcional" — NO "transformación organizacional". Un técnico de radiología necesita "imagenología, protección radiológica, tomografía" — NO "gestión de equipos".
PRODUCE UN JSON CON LA SIGUIENTE ESTRUCTURA EXACTA:
{
  "detected_name": "Nombre completo",
  "detected_email": "Email",
  "detected_phone": "Teléfono",
  "detected_role": "Cargo actual o principal",
  "detected_professional_field": "Área profesional real (ej: Fisioterapia, Retail, Ingeniería Civil, IT)",
  "global_score": <entero 0-100>,
  "salary_min": <entero>,
  "salary_max": <entero>,
  "currency": "${currency.code}",
  "market_context": "Breve justificación salarial para el mercado objetivo",
  "ats_keywords": ["keyword1", "keyword2", "keyword3"],
  "missing_keywords": ["keyword_faltante1", "keyword_faltante2"],
  "executive_summary": "Resumen de 3-4 frases sobre el perfil",
  "dimensions": [
    {
      "title": "Estructura y Formato",
      "score": <entero 0-100>,
      "benchmark": 65,
      "impactPhrase": "Frase de impacto",
      "strengths": ["punto fuerte 1", "punto fuerte 2"],
      "weaknesses": ["punto débil 1", "punto débil 2"],
      "detailed_feedback": "Feedback detallado"
    },
    {
      "title": "Contenido y Métricas",
      "score": <entero 0-100>,
      "benchmark": 55,
      "impactPhrase": "Frase de impacto",
      "strengths": ["punto fuerte 1", "punto fuerte 2"],
      "weaknesses": ["punto débil 1", "punto débil 2"],
      "detailed_feedback": "Feedback detallado"
    },
    {
      "title": "Educación y Formación",
      "score": <entero 0-100>,
      "benchmark": 70,
      "impactPhrase": "Frase de impacto",
      "strengths": ["punto fuerte 1", "punto fuerte 2"],
      "weaknesses": ["punto débil 1", "punto débil 2"],
      "detailed_feedback": "Feedback detallado"
    },
    {
      "title": "Experiencia",
      "score": <entero 0-100>,
      "benchmark": 60,
      "impactPhrase": "Frase de impacto",
      "strengths": ["punto fuerte 1", "punto fuerte 2"],
      "weaknesses": ["punto débil 1", "punto débil 2"],
      "detailed_feedback": "Feedback detallado"
    }
  ],
  "salaryDetailed": {
    "period": "monthly",
    "currency_code": "${currency.code}",
    "currency_symbol": "${currency.symbol}",
    "percentile25": <entero>,
    "median": <entero>,
    "percentile75": <entero>,
    "topMax": <entero>,
    "salary_label": "Rango salarial mensual bruto en ${currency.symbol}",
    "benefits": ["beneficio 1", "beneficio 2"],
    "benefitsNote": "Nota sobre beneficios",
    "source": "Estimación de mercado"
  },
  "automationRisk": {
    "percentage": <entero 0-100>,
    "level": "Low/Medium/High",
    "description": "Descripción del riesgo",
    "recommendations": ["recomendación 1", "recomendación 2"]
  },
  "priority_recommendations": {
    "immediate_adjustments": "Ajustes inmediatos"
  },
  "cv_problems": [
    {
      "title": "Título del problema",
      "description": "Descripción",
      "full_explanation": "Explicación completa",
      "correction_example": "Antes → Después",
      "rewrite_suggestion": "Sugerencia de reescritura"
    }
  ]${jobJsonES}
}
REGLAS CRÍTICAS:
1. global_score DEBE ser calculado como media ponderada: Estructura 25% + Contenido 30% + Educación 15% + Experiencia 30%
2. Las puntuaciones de las dimensiones DEBEN variar al menos 10 puntos entre la más alta y la más baja
3. TODOS los valores de benchmark y score DEBEN ser enteros simples (0-100), NO strings
4. El salario DEBE ser realista para la profesión y mercado detectados
5. Los beneficios DEBEN ser específicos para el área profesional detectada
6. Las recomendaciones de riesgo de automatización DEBEN ser específicas para la profesión detectada
7. Un CV con descripciones genéricas, sin métricas y estructura básica NUNCA debe puntuar por encima de 55
8. NUNCA inventes datos de contacto — usa null si no se encuentra en el CV`;

        const prompt = isEN ? promptEN : isES ? promptES : promptPT;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: prompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 1,

              maxOutputTokens: 16384,

              responseMimeType: 'application/json',

              thinkingConfig: { thinkingLevel: 'low' }

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          console.error('❌ Erro Gemini:', errorText);

          return jsonResponse({

            success: false,

            error: 'Erro ao chamar Gemini',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        let analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim().replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        let analysis;

        try {

          analysis = JSON.parse(analysisText);

        } catch (parseErr) {

          console.error('⚠️ JSON parse failed:', parseErr.message, 'Raw (500):', analysisText.substring(0, 500));

          try {

            const lastBrace = analysisText.lastIndexOf('}');

            if (lastBrace > 0) analysisText = analysisText.substring(0, lastBrace + 1);

            analysisText = analysisText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']').replace(/[\x00-\x1F\x7F]/g, ' ');

            analysis = JSON.parse(analysisText);

            console.log('✅ JSON repaired');

          } catch (repairErr) {

            console.error('❌ JSON repair failed:', repairErr.message);

            // RETRY: Try a second Gemini call with a simpler prompt

            console.log('🔄 Retrying with simplified prompt...');

            try {

              const retryPrompt = isEN ? `Analyze this CV and return a JSON. Be concise.\n\nCV:\n${sanitized.substring(0, 4000)}\n\nReturn JSON with: candidate_profile (detected_name, detected_email, detected_phone, total_years_exp, detected_role, seniority, key_skills), global_summary (strengths[3], improvements[3]), executive_summary (global_score 0-100, market_positioning), quadrants (4 items: Structure/Content/Education/Experience with score 0-100, benchmark 0-100), salaryDetailed (percentile25, median, percentile75, topMax as numbers in ${currency.code}, benefits[3], benefitsNote), automationRisk (percentage 0-100, level, description specific to role, recommendations[3] specific to role), cv_problems[3] (title, description). STRICT scoring: most CVs 35-65.` : `Analisa este CV e retorna JSON. Sê conciso.\n\nCV:\n${sanitized.substring(0, 4000)}\n\nRetorna JSON com: candidate_profile (detected_name, detected_email, detected_phone, total_years_exp, detected_role, seniority, key_skills), global_summary (strengths[3], improvements[3]), executive_summary (global_score 0-100, market_positioning), quadrants (4 items: Estrutura/Conteúdo/Formação/Experiência com score 0-100, benchmark 0-100), salaryDetailed (percentile25, median, percentile75, topMax como números em ${currency.code}, benefits[3], benefitsNote), automationRisk (percentage 0-100, level, description específica à função, recommendations[3] específicas à profissão), cv_problems[3] (title, description). Pontuação RIGOROSA: maioria dos CVs 35-65.`;

              const retryResponse = await fetch(geminiUrl, {

                method: 'POST',

                headers: {

                  'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                  contents: [

                    {

                      role: 'user',

                      parts: [

                        {

                          text: retryPrompt

                        }

                      ]

                    }

                  ],

                  generationConfig: {

                    temperature: 0.2,

                    maxOutputTokens: 16384,

                    responseMimeType: 'application/json'

                  }

                })

              });

              if (retryResponse.ok) {

                const retryData = await retryResponse.json();

                let retryText = retryData.candidates?.[0]?.content?.parts?.[0]?.text || '';

                retryText = retryText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim();

                analysis = JSON.parse(retryText);

                console.log('✅ Retry succeeded');

              } else {

                throw new Error('Retry Gemini call failed');

              }

            } catch (retryErr) {

              console.error('❌ Retry also failed:', retryErr.message);

              analysis = {

                candidate_profile: {

                  detected_name: 'N/A',

                  detected_email: 'N/A',

                  detected_phone: 'N/A',

                  total_years_exp: 'N/A',

                  detected_role: 'N/A',

                  seniority: 'N/A',

                  key_skills: []

                },

                global_summary: {

                  strengths: [

                    'Análise indisponível'

                  ],

                  improvements: [

                    'Não foi possível completar a análise. Por favor tente novamente.'

                  ]

                },

                executive_summary: {

                  global_score: '50',

                  market_positioning: 'Não foi possível analisar'

                },

                priority_recommendations: {

                  immediate_adjustments: 'Tente novamente'

                },

                cv_problems: []

              };

            }

          }

        }

        console.log('✅ Análise gerada:', JSON.stringify(analysis).substring(0, 300));

        // --- Normalize job title/role via lightweight Gemini call ---

        let normalizedData = {};

        try {

          const roleToNormalize = hasJob ? analysis.job_match?.job_title || analysis.candidate_profile?.detected_role || 'N/A' : analysis.candidate_profile?.detected_role || 'N/A';

          const skillsContext = (analysis.candidate_profile?.key_skills || []).slice(0, 8).join(', ');

          if (roleToNormalize && roleToNormalize !== 'N/A') {

            const normPrompt = `Given this job title/role: "${roleToNormalize}"

Skills context: ${skillsContext}



Return a JSON with:

- "normalized_role": a short standardized category (e.g. "Software Engineering", "Data Science", "HR / People", "Marketing", "Finance", "Product Management", "Design", "Sales", "Operations", "Consulting", "Healthcare", "Education", "Legal"). Use 1-3 words max.

- "role_keywords": array of 3-5 keywords that describe this role (domain tags, specializations). Example for "Head of People AI": ["People Analytics", "HR Tech", "Leadership", "AI"]

- "sector": the industry sector (e.g. "Technology", "Finance", "Healthcare", "Consulting", "Retail", "Education", "Manufacturing", "Media", "Government"). Use 1-2 words max.



Return ONLY the JSON, nothing else.`;

            const normResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {

              method: 'POST',

              headers: {

                'Content-Type': 'application/json'

              },

              body: JSON.stringify({

                contents: [

                  {

                    role: 'user',

                    parts: [

                      {

                        text: normPrompt

                      }

                    ]

                  }

                ],

                generationConfig: {

                  temperature: 0.1,

                  maxOutputTokens: 256,

                  responseMimeType: 'application/json'

                }

              })

            });

            if (normResponse.ok) {

              const normData = await normResponse.json();

              let normText = normData.candidates?.[0]?.content?.parts?.[0]?.text || '';

              normText = normText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

              const parsed = JSON.parse(normText);

              normalizedData = {

                normalized_role: parsed.normalized_role || null,

                role_keywords: Array.isArray(parsed.role_keywords) ? parsed.role_keywords : [],

                sector: parsed.sector || null

              };

              console.log('✅ Role normalized:', roleToNormalize, '->', normalizedData.normalized_role, '| sector:', normalizedData.sector, '| keywords:', normalizedData.role_keywords?.join(', '));

            }

          }

        } catch (normErr) {

          console.error('⚠️ Normalization error (non-fatal):', normErr.message);

        }

        // --- Track job search data in Supabase ---

        try {

          const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

          if (supabaseKey) {

            const supabase = createClient(supabaseUrl, supabaseKey);

            const trackingData = {

              candidate_name: analysis.candidate_profile?.detected_name || 'N/A',

              detected_role: analysis.candidate_profile?.detected_role || 'N/A',

              seniority: analysis.candidate_profile?.seniority || 'N/A',

              years_experience: analysis.candidate_profile?.total_years_exp || 'N/A',

              key_skills: analysis.candidate_profile?.key_skills || [],

              language: language || 'pt',

              source: 'cv_analyser',

              normalized_role: normalizedData.normalized_role || null,

              role_keywords: normalizedData.role_keywords || [],

              sector: normalizedData.sector || null

            };

            if (hasJob) {

              trackingData.job_description = jobDescription.substring(0, 5000);

              trackingData.job_title = analysis.job_match?.job_title || 'N/A';

              trackingData.ats_compatibility_score = analysis.job_match?.ats_compatibility_score || null;

              trackingData.keyword_gaps = analysis.job_match?.keyword_gaps || [];

              trackingData.matched_keywords = analysis.job_match?.matched_keywords || [];

              trackingData.overall_fit = analysis.job_match?.overall_fit || '';

            }

            const { error: insertError } = await supabase.from('job_search_tracking').insert(trackingData);

            if (insertError) {

              console.error('⚠️ Tracking insert error (non-fatal):', insertError.message);

            } else {

              console.log('✅ Job search tracked:', trackingData.detected_role, '->', trackingData.normalized_role, '| sector:', trackingData.sector, hasJob ? `-> ${trackingData.job_title}` : '(no job)');

            }

          }

        } catch (trackErr) {

          console.error('⚠️ Tracking error (non-fatal):', trackErr.message);

        }

        return jsonResponse({

          success: true,

          raw_text: sanitized,

          ...analysis

        });

      } catch (error) {

        console.error('❌ Erro no modo cv_extraction:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao processar análise',

          message: error.message

        }, 500);

      }

    }

    // MODE: CV Builder Parse (unchanged — internal tool, always PT)

    if (mode === 'cv_builder_parse') {

      console.log('📋 Modo: CV Builder Parse');

      const { valid, sanitized, error } = sanitizeCVText(cvText);

      if (!valid) {

        return jsonResponse({

          success: false,

          error

        }, 400);

      }

      try {

        const prompt = `CV A ANALISAR:



${sanitized}



---



TAREFA: Extrai TODOS os dados estruturados do CV acima.



REGRAS CRÍTICAS:

- Extrai TODAS as experiências profissionais

- Extrai TODA a formação académica

- Extrai TODAS as certificações e idiomas

- NUNCA inventes informação

- Se um campo não existir, usa "" ou []



ESTRUTURA DE SAÍDA (JSON válido):

{

  "personal_info": {

    "name": "Nome completo",

    "email": "Email",

    "phone": "Telefone",

    "location": "Cidade, País",

    "linkedin": "URL",

    "summary": "Resumo"

  },

  "experiences": [

    {

      "company": "Nome empresa",

      "role": "Cargo",

      "start_date": "YYYY-MM",

      "end_date": "YYYY-MM ou 'Presente'",

      "location": "Cidade",

      "description": "Responsabilidades"

    }

  ],

  "education": [

    {

      "institution": "Nome",

      "degree": "Grau",

      "field": "Área",

      "start_date": "YYYY",

      "end_date": "YYYY",

      "location": "Cidade"

    }

  ],

  "skills": {

    "technical": ["Skill 1"],

    "soft": ["Skill 1"],

    "other": ["Skill 1"]

  },

  "languages": [

    {

      "id": "lang-1",

      "name": "Português",

      "isNative": true,

      "level": 6

    }

  ],

  "certifications": [

    {

      "name": "Nome",

      "issuer": "Entidade",

      "date": "YYYY-MM",

      "expiry_date": null

    }

  ]

}



IMPORTANTE: Retorna APENAS o JSON.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: prompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 0,

              topK: 1,

              topP: 0.1,

              maxOutputTokens: 16384

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          return jsonResponse({

            success: false,

            error: 'Erro ao chamar Gemini',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        // Check for truncation

        const finishReason = geminiData.candidates?.[0]?.finishReason;

        if (finishReason === 'MAX_TOKENS') {

          console.warn('⚠️ CV Analysis response truncated by MAX_TOKENS');

        }

        let extractedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        extractedText = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim();

        const cvData = JSON.parse(extractedText);

        console.log('✅ Dados extraídos');

        return jsonResponse({

          success: true,

          cv_data: cvData

        });

      } catch (error) {

        console.error('❌ Erro no modo cv_builder_parse:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao processar CV',

          message: error.message

        }, 500);

      }

    }

    // =======================================================================

    // MODE: CV Builder Chat (Com Importação Automática do LinkedIn via Gemini)

    // =======================================================================

    if (mode === 'cv_builder_chat') {

      const { message, history, language: cvLang, current_cv } = body;

      const cvLanguage = cvLang || language || 'pt';

      const isPT = cvLanguage === 'pt' || cvLanguage === 'PT';

      console.log(`💬 Modo: CV Builder Chat [lang=${cvLanguage}]`);



      if (!message && (!history || history.length === 0)) {

        return jsonResponse({ success: false, error: 'Parâmetro "message" obrigatório' }, 400);

      }



      // Safety: message may be null if frontend sends empty turn

      const safeMessage = message ? String(message).trim() : '';



      try {

        let cvDataToInject = current_cv || {};

        let systemNotification = "";



        // 1. DETETAR SE O UTILIZADOR ENVIOU UM LINK DO LINKEDIN

        const linkedinRegex = /(https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+)/i;

        const linkedinMatch = safeMessage ? safeMessage.match(linkedinRegex) : null;



        if (linkedinMatch) {

          const linkedinUrl = linkedinMatch[0];

          console.log(`🔗 Link detetado no chat! A iniciar extração Gemini: ${linkedinUrl}`);

          

          // Extrair dados do LinkedIn via Apify (backend share2inspire)

          try {

            console.log(`\ud83d\udd0d A extrair perfil LinkedIn via Apify: ${linkedinUrl}`);

            const apifyResponse = await fetch('https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin', {

              method: 'POST',

              headers: { 'Content-Type': 'application/json' },

              body: JSON.stringify({ linkedin_url: linkedinUrl })

            });



            if (apifyResponse.ok) {

              const apifyData = await apifyResponse.json();

              console.log(`\ud83d\udce1 Apify response: success=${apifyData.success}, profile=${apifyData.profile_name}, cv_text_len=${apifyData.cv_text?.length || 0}`);



              if (apifyData.success && apifyData.cv_text) {

                const cvText = apifyData.cv_text;

                const nameMatch = cvText.match(/NOME:\s*(.+)/i);

                const rawName = nameMatch?.[1]?.trim() || '';

                const name = (rawName && !rawName.startsWith('TÍTULO') && rawName.length < 80) ? rawName : (apifyData.profile_name || '');

                const headlineMatch = cvText.match(/T[IÍ]TULO PROFISSIONAL:\s*(.+)/i);

                const headline = headlineMatch?.[1]?.trim() || apifyData.profile_headline || '';

                const locationMatch = cvText.match(/LOCALIZA[CÇ][AÃ]O:\s*(.+)/i);

                let location = '';

                if (locationMatch) {

                  const locStr = locationMatch[1].trim();

                  const fullMatch = locStr.match(/['"]full['"]:\s*['"]([^'"]+)['"]/i);

                  const cityMatch = locStr.match(/['"]city['"]:\s*['"]([^'"]+)['"]/i);

                  const countryMatch = locStr.match(/['"]country['"]:\s*['"]([^'"]+)['"]/i);

                  location = fullMatch?.[1] || (cityMatch?.[1] && countryMatch?.[1] ? `${cityMatch[1]}, ${countryMatch[1]}` : cityMatch?.[1] || countryMatch?.[1] || locStr);

                }

                const summaryMatch = cvText.match(/SOBRE \/ RESUMO PROFISSIONAL:\s*([\s\S]*?)(?=\nCOMPET[EÊ]NCIAS|\nEXPERI[EÊ]NCIA|$)/i);

                const summary = summaryMatch?.[1]?.trim() || '';

                const skillsMatch = cvText.match(/COMPET[EÊ]NCIAS PRINCIPAIS:\s*(.+)/i);

                const skills = skillsMatch?.[1]?.trim().split(/,\s*/).filter(s => s.trim()) || [];

                const expSection = cvText.match(/EXPERI[EÊ]NCIA PROFISSIONAL:\s*([\s\S]*?)(?=\nFORMA[CÇ][AÃ]O|\nCERTIFICA[CÇ]|\nIDIOMAS|$)/i);

                const experiences = [];

                if (expSection) {

                  const expEntries = expSection[1].split(/\n\s*[•\u2022]\s*/).filter(e => e.trim());

                  for (const entry of expEntries) {

                    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

                    if (lines.length > 0) {

                      const parts = lines[0].split('|').map(p => p.trim());

                      const role = (parts[0] || '').replace(/^[•\u2022]\s*/, '').trim();

                      const company = parts[1] || '';

                      const period = parts[2] || '';

                      const descLines = lines.slice(1).filter(l => !l.startsWith('Local:'));

                      experiences.push({ company, role, period, bullet_points: descLines.length > 0 ? descLines : [] });

                    }

                  }

                }

                const eduSection = cvText.match(/FORMA[CÇ][AÃ]O ACAD[EÉ]MICA:\s*([\s\S]*?)(?=\nCERTIFICA[CÇ]|\nIDIOMAS|\nPROJETOS|$)/i);

                const education = [];

                if (eduSection) {

                  const eduEntries = eduSection[1].split(/\n\s*[•\u2022]\s*/).filter(e => e.trim());

                  for (const entry of eduEntries) {

                    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

                    if (lines.length > 0) {

                      const parts = lines[0].split('|').map(p => p.trim());

                      const degreeField = (parts[0] || '').replace(/^[•\u2022]\s*/, '').trim();

                      const institution = parts[1] || '';

                      const period = parts[2] || '';

                      education.push({ institution, degree: degreeField, period });

                    }

                  }

                }

                // Extract certifications

                const certSection = cvText.match(/CERTIFICA[CÇ][OÕ]ES?(?:\s*E\s*LICEN[CÇ]AS?)?:\s*([\s\S]*?)(?=\nIDIOMAS|\nPROJETOS|\nPUBLICA|\nVOLUNT|\nPR[EÊ]MIOS|\nDISTIN|$)/i);

                const certifications = [];

                if (certSection) {

                  const certEntries = certSection[1].split(/\n\s*[•\u2022]\s*/).filter(e => e.trim());

                  for (const entry of certEntries) {

                    const lines = entry.split('\n').map(l => l.trim()).filter(l => l);

                    if (lines.length > 0) {

                      const parts = lines[0].split('|').map(p => p.trim());

                      const name = (parts[0] || '').replace(/^[•\u2022]\s*/, '').trim();

                      const issuer = parts[1] || '';

                      const date = parts[2] || '';

                      if (name) certifications.push({ name, issuer, date });

                    }

                  }

                }

                // Fallback: if section not structured, try line-by-line

                if (certifications.length === 0 && certSection) {

                  const lines = certSection[1].split('\n').map(l => l.trim().replace(/^[•\u2022]\s*/, '')).filter(l => l && l.length > 3);

                  for (const line of lines.slice(0, 10)) {

                    certifications.push({ name: line, issuer: '', date: '' });

                  }

                }



                // Extract languages

                const langSection = cvText.match(/IDIOMAS:\s*([\s\S]*?)(?=\nPROJETOS|\nPUBLICA|\nVOLUNT|\nPR[EÊ]MIOS|\nDISTIN|\nCURSOS|$)/i);

                const languages = [];

                if (langSection) {

                  const langLines = langSection[1].split('\n').map(l => l.trim().replace(/^[•\u2022]\s*/, '')).filter(l => l && l.length > 1);

                  for (const line of langLines.slice(0, 8)) {

                    languages.push(line);

                  }

                }



                cvDataToInject.personal_info = { name, email: '', phone: '', location, linkedin: linkedinUrl };

                cvDataToInject.target_role = headline;

                cvDataToInject.summary = summary;

                cvDataToInject.skills = skills;

                cvDataToInject.experiences = experiences.length > 0 ? experiences : [];

                cvDataToInject.education = education.length > 0 ? education : [];

                cvDataToInject.certifications = certifications;

                cvDataToInject.languages = languages;

                console.log(`\u2705 Apify LinkedIn data parsed: name=${name}, experiences=${experiences.length}, education=${education.length}, skills=${skills.length}, certifications=${certifications.length}, languages=${languages.length}`);

                systemNotification = `[SISTEMA: O perfil do LinkedIn do utilizador acabou de ser importado com sucesso via Apify. Os dados REAIS foram preenchidos no JSON, incluindo ${certifications.length} certificação(ões): ${certifications.slice(0,3).map(c=>c.name).join(', ')}. O nome é ${name}, trabalha como ${headline}. Reconhece especificamente as certificações encontradas, menciona detalhes de cargo e empresa, e diz que o foco será agora otimizar as descrições de experiência com métricas (Método STAR), começando pela mais recente.]\n\n[CV_TEXT COMPLETO DO LINKEDIN:]\n${cvText}`;

              } else {

                console.warn('\u26a0\ufe0f Apify returned no data:', apifyData.error || 'unknown');

                systemNotification = `[SISTEMA: Não foi possível extrair dados do perfil LinkedIn. Pede ao utilizador para verificar se o URL está correcto e se o perfil é público, ou introduzir os dados manualmente.]`;

              }

            } else {

              const errText = await apifyResponse.text();

              console.error('\u274c Apify scrape failed:', errText.substring(0, 300));

              systemNotification = `[SISTEMA: A extração do LinkedIn falhou. Pede desculpa e sugere ao utilizador introduzir os dados manualmente ou verificar se o perfil é público.]`;

            }

          } catch (err) {

            console.error('\u274c Erro na extração LinkedIn via Apify:', err);

            systemNotification = `[SISTEMA: A extração do LinkedIn falhou com erro: ${err.message}. Pede desculpa e diz ao utilizador para introduzir os dados manualmente.]`;

          }

        }



        // 2. O PROMPT DE SISTEMA

        const systemPrompt = isPT ? `

És o "CV Maker" da Share2Inspire, um consultor de carreira de elite que constrói CVs otimizados para ATS através de uma conversa.



REGRAS DA CONVERSA (CRÍTICO):

1. TU LIDERAS A ENTREVISTA: NUNCA perguntes coisas vagas como "O que queres adicionar a seguir?". És tu que guias o utilizador.

2. IMPORTAÇÃO LINKEDIN: Se o utilizador não tiver CV, sugere-lhe colar o link do LinkedIn dele aqui no chat para importar tudo automaticamente.

3. OTIMIZAÇÃO: O teu maior valor não é "escrever o que ele diz", mas sim REESCREVER e OTIMIZAR. Se os dados vieram do LinkedIn, pega na experiência mais recente e diz: "Vamos melhorar esta experiência. Qual foi a tua maior métrica de impacto aqui?".



DEVOLVE SEMPRE APENAS UM JSON VÁLIDO COM ESTA ESTRUTURA:

{

  "chat_reply": "A tua resposta e a TUA PRÓXIMA PERGUNTA DIRETIVA.",

  "cv_data": {

    "personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },

    "target_role": "",

    "summary": "",

    "experiences":[ { "company": "", "role": "", "period": "", "bullet_points": [""] } ],

    "education":[ { "institution": "", "degree": "", "period": "" } ],

    "certifications": [ { "name": "", "issuer": "", "date": "" } ],

    "languages": [""],

    "skills": [""]

  }

}

ATENÇÃO: Mantém sempre os dados atuais no cv_data, incluindo certificações e idiomas.

` : `You are the "CV Maker" by Share2Inspire, an elite career consultant building ATS-optimized CVs via chat.



CONVERSATIONAL RULES (CRITICAL):

1. YOU LEAD THE INTERVIEW: NEVER ask vague questions like "What would you like to add next?". YOU guide the user step-by-step.

2. LINKEDIN IMPORT: If the user doesn't have a CV ready, suggest they paste their LinkedIn profile URL here in the chat to auto-import everything.

3. OPTIMIZATION: Your greatest value is NOT just writing what they say, but REWRITING and OPTIMIZING. If data came from LinkedIn, take the most recent experience and say: "Let's improve this experience. What was your biggest impact metric here?".



YOU MUST ALWAYS RETURN ONLY A VALID JSON WITH THIS EXACT STRUCTURE:

{

  "chat_reply": "Your reply and YOUR NEXT DIRECTIVE QUESTION to the user.",

  "cv_data": {

    "personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "" },

    "target_role": "",

    "summary": "",

    "experiences":[ { "company": "", "role": "", "period": "", "bullet_points": [""] } ],

    "education":[ { "institution": "", "degree": "", "period": "" } ],

    "certifications": [ { "name": "", "issuer": "", "date": "" } ],

    "languages": [""],

    "skills": [""]

  }

}

WARNING: Always retain previously collected data in the cv_data object, including certifications and languages.`;



        let contextMessage = safeMessage;

        if (Object.keys(cvDataToInject).length > 0) {

           contextMessage = `[DADOS ATUAIS DO CV: ${JSON.stringify(cvDataToInject)}]\n${systemNotification}\n\nMensagem do utilizador: ${safeMessage}`;

        }



        const contents = [

          { role: 'user', parts: [{ text: systemPrompt }] },

          { role: 'model', parts: [{ text: '{"chat_reply":"Compreendido. Liderarei a conversa.","cv_data":{}}' }] },

          ...(Array.isArray(history) ? history : []).map(msg => ({

            role: msg.role === 'user' ? 'user' : 'model',

            parts: [{ text: String(msg.content || msg.text || '') }]

          })).filter(m => m.parts[0].text),

          { role: 'user', parts: [{ text: contextMessage }] }

        ];



        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;



        const geminiResponse = await fetchWithRetry(geminiUrl, {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            contents,

            generationConfig: {

              temperature: 0.3,

              maxOutputTokens: 4096,

              responseMimeType: 'application/json'

            }

          })

        });



        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          console.error('❌ Gemini CV Builder error:', errorText.substring(0, 300));

          return jsonResponse({

            success: false,

            error: isPT ? 'Erro ao chamar Gemini no CV Builder' : 'Error calling Gemini in CV Builder',

            details: errorText.substring(0, 200)

          }, 500);

        }



        const geminiData = await geminiResponse.json();



        // Check finishReason before parsing

        const rawText = extractGeminiText(geminiData, 'cv_builder_chat');



        let parsedResult: any = null;

        if (rawText) {

          try {

            parsedResult = JSON.parse(rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

          } catch (parseErr) {

            console.warn('⚠️ CV Builder JSON parse failed, attempting repair:', parseErr.message);

            // Attempt to extract just the chat_reply via regex as fallback

            const replyMatch = rawText.match(/"chat_reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);

            if (replyMatch) {

              parsedResult = { chat_reply: replyMatch[1], cv_data: cvDataToInject };

            }

          }

        }



        // Final fallback if everything failed

        if (!parsedResult) {

          console.warn('⚠️ CV Builder: using fallback response');

          parsedResult = {

            chat_reply: isPT

              ? 'Obrigado pela informação! Podes continuar a partilhar os detalhes da tua experiência.'

              : 'Thank you for the information! Please continue sharing your experience details.',

            cv_data: cvDataToInject

          };

        }



        console.log(`✅ CV Builder Chat: reply=${(parsedResult.chat_reply || '').length}chars, cv_data=${parsedResult.cv_data ? 'YES' : 'NO'}`);



        // Deep merge: Apify data (cvDataToInject) takes priority for non-empty fields

        let finalCvData = parsedResult.cv_data || {};

        if (cvDataToInject && Object.keys(cvDataToInject).length > 0) {

          if (cvDataToInject.personal_info) {

            finalCvData.personal_info = finalCvData.personal_info || {};

            for (const [k, v] of Object.entries(cvDataToInject.personal_info)) {

              if (v && String(v).trim()) finalCvData.personal_info[k] = v;

            }

          }

          if (cvDataToInject.target_role && String(cvDataToInject.target_role).trim()) finalCvData.target_role = cvDataToInject.target_role;

          if (cvDataToInject.summary && String(cvDataToInject.summary).trim()) finalCvData.summary = cvDataToInject.summary;

          if (cvDataToInject.experiences?.length > 0) finalCvData.experiences = cvDataToInject.experiences;

          if (cvDataToInject.education?.length > 0) finalCvData.education = cvDataToInject.education;

          if (cvDataToInject.certifications?.length > 0) finalCvData.certifications = cvDataToInject.certifications;

          if (cvDataToInject.languages?.length > 0) finalCvData.languages = cvDataToInject.languages;

          if (cvDataToInject.skills?.length > 0) finalCvData.skills = cvDataToInject.skills;

        }



        console.log(`📋 Final CV Data: name=${finalCvData.personal_info?.name || 'N/A'}, experiences=${finalCvData.experiences?.length || 0}, skills=${finalCvData.skills?.length || 0}`);



        return jsonResponse({

          success: true,

          reply: parsedResult.chat_reply || (isPT ? 'Dados atualizados. Continua!' : 'Data updated. Please continue!'),

          cv_data: finalCvData,

          type: 'cv_builder_chat'

        });



      } catch (error) {

        console.error('❌ Erro no modo cv_builder_chat:', error);

        return jsonResponse({

          success: false,

          error: isPT ? 'Erro ao processar a construção do CV' : 'Error processing CV Builder',

          message: error.message

        }, 500);

      }

    }



    // MODE: CV Analysis (Premium)

    if (mode === 'cv_analysis') {

      console.log(`📊 Modo: CV Analysis Premium [lang=${language}]`);

      const { valid, sanitized, error } = sanitizeCVText(cvText);

      if (!valid) {

        return jsonResponse({

          success: false,

          error

        }, 400);

      }

      try {

        const cvOutputLanguageInstruction = getLanguageOutputInstruction(language);

        const systemPrompt = isEN ? `You are a BRUTALLY HONEST senior CV analyst with 15+ years in recruitment and ATS systems. You score CVs STRICTLY — most CVs score between 35-65. A score above 75 is EXCEPTIONAL and rare. You MUST adapt ALL analysis, recommendations, and automation risk to the ACTUAL professional field detected in the CV (e.g., physiotherapy, nursing, teaching, engineering, retail — NOT just business/corporate). Every sentence must reference CONCRETE elements from the CV. NEVER use generic corporate phrases for non-corporate roles.

${cvOutputLanguageInstruction}



STRICT SCORING RUBRIC (you MUST follow this):

- 0-25: Severely deficient CV — missing critical sections, no clear role, major formatting issues

- 26-40: Below average — has basic info but lacks metrics, weak structure, generic descriptions

- 41-55: Average — functional but unremarkable, some metrics, decent structure, room for improvement

- 56-70: Good — well-structured, has quantified achievements, clear career narrative

- 71-85: Very good — strong metrics, excellent structure, compelling narrative, minor issues only

- 86-100: Exceptional — virtually flawless, strong personal brand, perfect for target role (EXTREMELY RARE)



SCORING PENALTIES (apply these BEFORE scoring):

- No quantified metrics/achievements in experience descriptions: -15 points from Content

- No professional summary/objective: -10 points from Structure

- Generic job descriptions (duties instead of achievements): -12 points from Content

- Missing relevant certifications for the field: -8 points from Education

- No keywords optimised for ATS: -10 points from Structure

- Inconsistent formatting (fonts, spacing, alignment): -8 points from Structure

- Experience descriptions under 2 lines each: -10 points from Experience

- No progression shown between roles: -8 points from Experience



The OVERALL score must be the weighted average: Structure 25%, Content 30%, Education 15%, Experience 30%.

Dimension scores MUST vary by at least 10 points between the highest and lowest — uniform scores are FORBIDDEN.

The automationRisk recommendations MUST be specific to the detected professional field, NOT generic business advice.` : isES ? `Eres un analista de CVs BRUTALMENTE HONESTO con más de 15 años en reclutamiento y sistemas ATS. Puntúas CVs de forma RIGUROSA — la mayoría de los CVs puntúan entre 35-65. Una puntuación superior a 75 es EXCEPCIONAL y rara. DEBES adaptar TODA la analítica, recomendaciones y riesgo de automatización al ÁREA PROFESIONAL REAL detectada en el CV (ej: fisioterapia, enfermería, enseñanza, ingeniería, retail — NO solo business/corporate). Cada frase debe referir elementos CONCRETOS del CV. NUNCA uses frases genéricas corporativas para funciones no corporativas.
${cvOutputLanguageInstruction}
RÚBRICA DE PUNTUACIÓN ESTRICTA (DEBES seguir esto):
- 0-25: CV severamente deficiente — faltan secciones críticas, sin función clara, problemas graves de formato
- 26-40: Por debajo de la media — tiene información básica pero faltan métricas, estructura débil, descripciones genéricas
- 41-55: Medio — funcional pero sin destacar, algunas métricas, estructura decente, margen de mejora
- 56-70: Bueno — bien estructurado, tiene logros cuantificados, narrativa de carrera clara
- 71-85: Muy bueno — impacto de negocio fuerte, métricas excelentes, optimizado para ATS
- 86-100: Excepcional — top 1% de candidatos, narrativa perfecta, impacto masivo cuantificado
REGLAS ANTI-FABRICACIÓN (CRÍTICO):
- detected_name: copia EXACTAMENTE como aparece en el encabezado del CV. NO adivines ni inventes.
- detected_email / detected_phone: copia exactamente como se encuentra, o usa null si está ausente.
- Todos los campos de score DEBEN ser enteros (ej: 62, no "62" ni "62/100").
- Todos los campos salariales DEBEN ser enteros en ${currency.code} (ej: 2500, no "2500" ni "2.500 EUR").
- Si un campo no puede determinarse de forma fiable a partir del CV, usa null. Nunca fabricar.
REGLAS DE FEEDBACK POR ÁREA:
SALUD: Enfócate en volumen de pacientes, especialidades clínicas, certificaciones, gestión de crisis — NO en "crecimiento de ingresos" o "gestión de stakeholders"
EDUCACIÓN: Enfócate en metodologías de enseñanza, tamaño de clases, desarrollo curricular, resultados de alumnos — NO en "optimización de procesos"
INGENIERÍA: Enfócate en herramientas técnicas, alcance de proyectos, normativas de seguridad, presupuestos gestionados
OFICIOS: Enfócate en certificaciones especializadas, resolución de problemas complejos, experiencia en seguridad, transición energética verde — NO liderazgo de IA y automatización
COMERCIO: Enfócate en experiencia del cliente, visual merchandising, competencias de e-commerce, gestión de inventario — NO liderazgo ejecutivo
TECNOLOGÍA: Enfócate en frameworks emergentes, arquitectura cloud, competencias IA/ML, diseño de sistemas — apropiado al área
CORPORATIVO: Liderazgo, pensamiento estratégico, transformación digital — SOLO para funciones realmente corporativas
KEYWORDS ATS POR ÁREA: Las keywords detectadas y recomendadas DEBEN ser relevantes para el área profesional. Un enfermero necesita "cuidados al paciente, evaluación clínica, administración de medicación" — NO "gestión de stakeholders, ROI, KPIs". Un mecánico necesita "diagnóstico, mantenimiento preventivo, sistemas hidráulicos" — NO "gestión de proyectos, metodología agile". Un fisioterapeuta necesita "rehabilitación, terapia manual, evaluación funcional" — NO "transformación organizacional". Un técnico de radiología necesita "imagenología, protección radiológica, tomografía" — NO "gestión de equipos".` : `És um analista de CVs BRUTALMENTE HONESTO com mais de 15 anos em recrutamento e sistemas ATS. Pontuas CVs de forma RIGOROSA — a maioria dos CVs pontua entre 35-65. Um score acima de 75 é EXCEPCIONAL e raro. DEVES adaptar TODA a análise, recomendações e risco de automação à ÁREA PROFISSIONAL REAL detectada no CV (ex: fisioterapia, enfermagem, ensino, engenharia, retalho — NÃO apenas business/corporate). Cada frase deve referir elementos CONCRETOS do CV. NUNCA uses frases genéricas corporativas para funções não-corporativas.



RUBRICA DE PONTUAÇÃO ESTRITA (DEVES seguir isto):

- 0-25: CV severamente deficiente — faltam secções críticas, sem função clara, problemas graves de formatação

- 26-40: Abaixo da média — tem informação básica mas faltam métricas, estrutura fraca, descrições genéricas

- 41-55: Médio — funcional mas sem destaque, algumas métricas, estrutura decente, margem para melhoria

- 56-70: Bom — bem estruturado, tem conquistas quantificadas, narrativa de carreira clara

- 71-85: Muito bom — métricas fortes, estrutura excelente, narrativa convincente, apenas problemas menores

- 86-100: Excepcional — praticamente perfeito, marca pessoal forte, ideal para a função alvo (EXTREMAMENTE RARO)



PENALIZAÇÕES DE PONTUAÇÃO (aplica ANTES de pontuar):

- Sem métricas/conquistas quantificadas nas descrições de experiência: -15 pontos em Conteúdo

- Sem resumo profissional/objectivo: -10 pontos em Estrutura

- Descrições de funções genéricas (tarefas em vez de conquistas): -12 pontos em Conteúdo

- Faltam certificações relevantes para a área: -8 pontos em Formação

- Sem keywords optimizadas para ATS: -10 pontos em Estrutura

- Formatação inconsistente (fontes, espaçamento, alinhamento): -8 pontos em Estrutura

- Descrições de experiência com menos de 2 linhas cada: -10 pontos em Experiência

- Sem progressão demonstrada entre funções: -8 pontos em Experiência



O score GLOBAL deve ser a média ponderada: Estrutura 25%, Conteúdo 30%, Formação 15%, Experiência 30%.

Os scores das dimensões DEVEM variar pelo menos 10 pontos entre o mais alto e o mais baixo — scores uniformes são PROIBIDOS.

As recomendações de automationRisk DEVEM ser específicas à área profissional detectada, NÃO conselhos genéricos de business.`;

        // Gemini company enrichment

        const companyContext = await enrichWithCompanyData(sanitized, language);

        const userPrompt = isEN ? `${cvOutputLanguageInstruction}

Analyse the following CV and return a JSON EXACTLY with this structure. EACH field must contain analysis SPECIFIC to this CV — cite sections, phrases and concrete data from the CV.



CV:

${sanitized}

${companyContext}

TARGET MARKET: ${marketCtx}

CURRENCY: ${currency.symbol} (${currency.code})



RETURN EXACTLY this JSON (no text before or after):

{

  "atsRejectionRate": <number 0-100, probability of automatic rejection by ATS>,

  "atsTopFactor": "<main factor affecting ATS compatibility of THIS specific CV — cite the concrete problem>",

  "detailedAtsAnalysis": {

    "factors": [

      { "factor": "<factor name>", "status": "pass|warning|fail", "detail": "<SPECIFIC explanation — cite concrete sections/elements>" }

    ],

    "atsSystems": [

      { "name": "Workday", "compatibility": "Excellent|Good|Poor" },

      { "name": "SAP SF", "compatibility": "Excellent|Good|Poor" },

      { "name": "Taleo", "compatibility": "Excellent|Good|Poor" },

      { "name": "Greenhouse", "compatibility": "Excellent|Good|Poor" }

    ],

    "quickFixes": ["<concrete fix 1 referencing CV element>", "<fix 2>", "<fix 3>"]

  },

  "quadrants": [

    {

      "title": "Structure",

      "score": <0-100>,

      "benchmark": <benchmark for this seniority level>,

      "impactPhrase": "<short SPECIFIC phrase about the impact of THIS CV's structure>",

      "strengths": ["<specific strength>"],

      "weaknesses": ["<specific weakness>"],

      "detailed_feedback": "<2-3 CONCRETE sentences about structure — CITE real CV elements>"

    },

    {

      "title": "Content",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<specific phrase about content>",

      "strengths": ["<specific strength>"],

      "weaknesses": ["<specific weakness>"],

      "detailed_feedback": "<2-3 CONCRETE sentences about content>"

    },

    {

      "title": "Education",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<specific phrase>",

      "strengths": ["<specific strength>"],

      "weaknesses": ["<specific weakness>"],

      "detailed_feedback": "<2-3 CONCRETE sentences>"

    },

    {

      "title": "Experience",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<specific phrase>",

      "strengths": ["<specific strength>"],

      "weaknesses": ["<specific weakness>"],

      "detailed_feedback": "<2-3 CONCRETE sentences>"

    }

  ],

  "keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],

  "perceivedRole": "<role a recruiter would perceive>",

  "perceivedSeniority": "<Junior|Mid-level|Senior|Director|C-Level>",

  "recruiterDeepAnalysis": {

    "firstImpression": "<what a recruiter thinks in the first 6 seconds>",

    "redFlags": ["<specific red flag>"],

    "greenFlags": ["<specific green flag>"],

    "interviewLikelihood": "<High|Medium|Low>",

    "interviewLikelihoodReason": "<why — with reference to concrete CV elements>"

  },

  "salaryDetailed": {

    "period": "monthly",

    "currency_code": "${currency.code}",

    "currency_symbol": "${currency.symbol}",

    "percentile25": <integer monthly gross in ${currency.code}>,

    "median": <integer monthly gross in ${currency.code}>,

    "percentile75": <integer monthly gross in ${currency.code}>,

    "topMax": <integer monthly gross in ${currency.code}>,

    "salary_label": "Monthly gross salary range in ${currency.symbol} for ${marketCtx} — e.g. '${currency.symbol}2,200 – ${currency.symbol}3,500/month gross'",

    "benefits": ["<typical benefit 1>", "<benefit 2>", "<benefit 3>"],

    "benefitsNote": "<note about typical benefits for this profile in ${marketCtx}>",

    "source": "Estimate based on market data for the detected role and seniority in ${marketCtx}"

  },

  "automationRisk": {

    "percentage": <0-100>,

    "level": "Low|Medium|High",

    "description": "<SPECIFIC analysis of automation risk for THIS role/area>",

    "recommendations": ["<specific recommendation 1>", "<recommendation 2>", "<recommendation 3>"]

  },

  "improvementActions": [

    {

      "action": "<concrete improvement action>",

      "impact": <1-10>,

      "before": "<REAL text or paraphrase from the CV>",

      "after": "<concrete suggestion of how it should read>"

    },

    {

      "action": "<action 2>",

      "impact": <1-10>,

      "before": "<real before>",

      "after": "<suggested after>"

    },

    {

      "action": "<action 3>",

      "impact": <1-10>,

      "before": "<real before>",

      "after": "<suggested after>"

    }

  ],

  "actionPlan": [

    {

      "week": "Week 1-2",

      "title": "<personalised title based on priority #1>",

      "tasks": ["<specific task 1>", "<task 2>", "<task 3>"]

    },

    {

      "week": "Week 3",

      "title": "<personalised title based on priority #2>",

      "tasks": ["<specific task 1>", "<task 2>", "<task 3>"]

    },

    {

      "week": "Week 4",

      "title": "<personalised title based on priority #3>",

      "tasks": ["<specific task 1>", "<task 2>", "<task 3>"]

    }

  ]

}



CRITICAL RULES:

1. EACH field must contain analysis SPECIFIC to this CV — never generic text

2. Cite company names, roles, dates and real CV sections

3. Benchmarks must be realistic for the detected seniority level

4. improvementActions must have "before" with REAL CV text and "after" with concrete suggestion

5. actionPlan must be personalised to this specific CV's priorities

6. Salaries must be in ${currency.symbol} (${currency.code}) and realistic for ${marketCtx}

7. Return ONLY the JSON, no additional text

8. ALL text must be in English

9. SCORING CALIBRATION: Start from 50 (average) and apply penalties/bonuses. Most CVs should score 35-65. Only truly exceptional CVs score above 75. A CV with generic descriptions, no metrics, and basic structure should NEVER score above 55.

10. FIELD-SPECIFIC ANALYSIS: You MUST detect the professional field from the CV content and adapt EVERYTHING to that field. NEVER apply corporate/business templates to non-corporate roles.

11. Dimension scores MUST have at least 10 points spread between highest and lowest. If all dimensions are within 5 points of each other, you are being lazy — re-evaluate.

12. The overall score is the WEIGHTED AVERAGE of dimensions: Structure 25% + Content 30% + Education 15% + Experience 30%. Calculate it, do not guess.

13. SALARY REFERENCE TABLE (adapt to detected market, seniority, and field):

  HEALTHCARE: Physiotherapist (900-2200), Nurse (1100-2400), Radiologist/Technician (1000-2200), Pharmacist (1200-2800), Doctor/GP (2500-5500), Dentist (1500-4000), Psychologist (900-2500), Nutritionist (800-2000), Speech Therapist (900-1800), Occupational Therapist (900-1800)

  EDUCATION: Teacher (1200-2800), University Professor (1800-4500), Trainer/Instructor (800-2000), Childcare Worker (800-1200), Special Education Teacher (1200-2500)

  ENGINEERING: Civil Engineer (1200-3500), Mechanical Engineer (1200-3200), Electrical Engineer (1300-3500), Chemical Engineer (1300-3500), Environmental Engineer (1100-2800)

  TECHNOLOGY: Software Engineer (1500-4500), Data Analyst (1200-3000), UX/UI Designer (1200-3000), IT Support (900-1800), DevOps Engineer (1800-4500), Cybersecurity Analyst (1500-4000)

  TRADES & INDUSTRY: Electrician (900-1800), Plumber (800-1600), Mechanic (800-1600), Welder (800-1500), CNC Operator (900-1600), Factory Worker (800-1200), Quality Inspector (1000-2000)

  RETAIL & HOSPITALITY: Shop Assistant (800-1200), Store Manager (1100-2000), Chef (900-2500), Waiter (800-1100), Hotel Receptionist (800-1400), Tourism Guide (800-1500)

  BUSINESS & CORPORATE: HR Manager (2000-5000), HR Director (3500-8000), Marketing Manager (1800-4000), Finance Manager (2000-5500), Consultant (1500-4500), Project Manager (1500-4000)

  LEGAL: Lawyer (1200-5000), Paralegal (900-1800), Notary (2000-5000), Legal Advisor (1500-3500)

  CREATIVE: Graphic Designer (900-2200), Architect (1200-3500), Journalist (900-2200), Photographer (700-1800), Video Editor (800-2000)

  AGRICULTURE & ENVIRONMENT: Agronomist (1000-2500), Veterinarian (1200-3000), Environmental Technician (900-2000)

  SOCIAL & PUBLIC: Social Worker (1000-2000), Public Administrator (1200-2800), Firefighter (1000-1800), Police Officer (1100-2000)

  These are MONTHLY GROSS values in EUR for Portugal. Scale proportionally for other markets.

14. BENEFITS BY FIELD (use ONLY benefits typical for the detected field):

  HEALTHCARE: Professional liability insurance, continuous medical education, flexible shifts, health insurance, overtime pay, career progression in clinical grades

  EDUCATION: School holidays, reduced timetable, sabbatical leave, research grants, tuition support

  ENGINEERING: Company car (senior), technical training, safety equipment, project bonuses, professional association membership

  TECHNOLOGY: Remote work, stock options, learning budget, flexible hours, health insurance, equipment allowance

  TRADES: Overtime pay, safety equipment, tool allowance, transport subsidy, meal allowance

  RETAIL/HOSPITALITY: Staff discounts, tips, meal allowance, shift premiums, transport subsidy

  CORPORATE: Performance bonus, company car, stock options, private health insurance, pension plan, gym membership

  LEGAL: Professional development, bar association fees, flexible billing, partnership track

  CREATIVE: Portfolio development time, equipment allowance, flexible schedule, exhibition/conference support

15. AUTOMATION RISK BY FIELD (adapt recommendations to the actual profession):

  HEALTHCARE: Focus on patient relationship skills, specialised clinical techniques, interdisciplinary collaboration, telehealth adaptation — NOT generic "leadership" or "digital transformation"

  EDUCATION: Focus on pedagogical innovation, student engagement, curriculum design, EdTech integration — NOT corporate strategy

  TRADES: Focus on specialised certifications, complex problem-solving, safety expertise, green energy transition — NOT AI and automation leadership

  RETAIL: Focus on customer experience, visual merchandising, e-commerce skills, inventory management — NOT executive leadership

  TECHNOLOGY: Focus on emerging frameworks, cloud architecture, AI/ML skills, system design — field-appropriate

  CORPORATE: Leadership, strategic thinking, digital transformation — ONLY for actual corporate roles

16. ATS KEYWORDS BY FIELD: The keywords detected and recommended MUST be relevant to the professional field. A nurse needs "patient care, clinical assessment, medication administration" — NOT "stakeholder management, ROI, KPIs". A mechanic needs "diagnostics, preventive maintenance, hydraulic systems" — NOT "project management, agile methodology".` : isES ? `${cvOutputLanguageInstruction}

Analiza el siguiente CV y devuelve un JSON EXACTAMENTE con esta estructura. CADA campo debe contener análisis ESPECÍFICO de este CV — cita secciones, frases y datos concretos del CV.



CV:

${sanitized}

${companyContext}

MERCADO OBJETIVO: ${marketCtx}

MONEDA: ${currency.symbol} (${currency.code})



DEVUELVE EXACTAMENTE este JSON (sin texto antes ni después):

{

  "atsRejectionRate": <número 0-100, probabilidad de rechazo automático por ATS>,

  "atsTopFactor": "<factor principal que afecta la compatibilidad ATS de ESTE CV específico — cita el problema concreto>",

  "detailedAtsAnalysis": {

    "factors": [

      { "factor": "<nombre del factor>", "status": "pass|warning|fail", "detail": "<explicación ESPECÍFICA — cita secciones/elementos concretos>" }

    ],

    "atsSystems": [

      { "name": "Workday", "compatibility": "Excelente|Buena|Pobre" },

      { "name": "SAP SF", "compatibility": "Excelente|Buena|Pobre" },

      { "name": "Taleo", "compatibility": "Excelente|Buena|Pobre" },

      { "name": "Greenhouse", "compatibility": "Excelente|Buena|Pobre" }

    ],

    "quickFixes": ["<fix concreto 1 referenciando elemento del CV>", "<fix 2>", "<fix 3>"]

  },

  "quadrants": [

    {

      "title": "Estructura",

      "score": <0-100>,

      "benchmark": <benchmark para este nivel de antigüedad>,

      "impactPhrase": "<frase corta y ESPECÍFICA sobre el impacto de la estructura de ESTE CV>",

      "strengths": ["<fortaleza específica>"],

      "weaknesses": ["<debilidad específica>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre la estructura — CITA elementos reales del CV>"

    },

    {

      "title": "Contenido",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica sobre el contenido>",

      "strengths": ["<fortaleza específica>"],

      "weaknesses": ["<debilidad específica>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre el contenido>"

    },

    {

      "title": "Formación",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica>",

      "strengths": ["<fortaleza específica>"],

      "weaknesses": ["<debilidad específica>"],

      "detailed_feedback": "<2-3 frases CONCRETAS>"

    },

    {

      "title": "Experiencia",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica>",

      "strengths": ["<fortaleza específica>"],

      "weaknesses": ["<debilidad específica>"],

      "detailed_feedback": "<2-3 frases CONCRETAS>"

    }

  ],

  "keywords": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],

  "perceivedRole": "<función que un reclutador percibiría>",

  "perceivedSeniority": "<Junior|Intermedio|Senior|Director|C-Level>",

  "recruiterDeepAnalysis": {

    "firstImpression": "<lo que un reclutador piensa en los primeros 6 segundos>",

    "redFlags": ["<red flag específica>"],

    "greenFlags": ["<green flag específica>"],

    "interviewLikelihood": "<Alta|Media|Baja>",

    "interviewLikelihoodReason": "<por qué — con referencia a elementos concretos del CV>"

  },

  "salaryDetailed": {

    "period": "mensual",

    "currency_code": "${currency.code}",

    "currency_symbol": "${currency.symbol}",

    "percentile25": <entero bruto mensual en ${currency.code}>,

    "median": <entero bruto mensual en ${currency.code}>,

    "percentile75": <entero bruto mensual en ${currency.code}>,

    "topMax": <entero bruto mensual en ${currency.code}>,

    "salary_label": "Rango salarial bruto mensual en ${currency.symbol} para ${marketCtx} — ej: '${currency.symbol}2.200 – ${currency.symbol}3.500/mes bruto'",

    "benefits": ["<beneficio típico 1>", "<beneficio 2>", "<beneficio 3>"],

    "benefitsNote": "<nota sobre beneficios típicos para este perfil en ${marketCtx}>",

    "source": "Estimación basada en datos de mercado para la función y antigüedad detectadas en ${marketCtx}"

  },

  "automationRisk": {

    "percentage": <0-100>,

    "level": "Bajo|Medio|Alto",

    "description": "<análisis ESPECÍFICO del riesgo de automatización para ESTA función/área>",

    "recommendations": ["<recomendación específica 1>", "<recomendación 2>", "<recomendación 3>"]

  },

  "improvementActions": [

    {

      "action": "<acción concreta de mejora>",

      "impact": <1-10>,

      "before": "<texto REAL o paráfrasis del CV>",

      "after": "<sugerencia concreta de cómo debería quedar>"

    },

    {

      "action": "<acción 2>",

      "impact": <1-10>,

      "before": "<antes real>",

      "after": "<después sugerido>"

    },

    {

      "action": "<acción 3>",

      "impact": <1-10>,

      "before": "<antes real>",

      "after": "<después sugerido>"

    }

  ],

  "actionPlan": [

    {

      "week": "Semana 1-2",

      "title": "<título personalizado basado en la prioridad #1>",

      "tasks": ["<tarea específica 1>", "<tarea 2>", "<tarea 3>"]

    },

    {

      "week": "Semana 3",

      "title": "<título personalizado basado en la prioridad #2>",

      "tasks": ["<tarea específica 1>", "<tarea 2>", "<tarea 3>"]

    },

    {

      "week": "Semana 4",

      "title": "<título personalizado basado en la prioridad #3>",

      "tasks": ["<tarea específica 1>", "<tarea 2>", "<tarea 3>"]

    }

  ]

}



REGLAS CRÍTICAS:

1. CADA campo debe contener análisis ESPECÍFICO de este CV — nunca texto genérico

2. Cita nombres de empresas, funciones, fechas y secciones reales del CV

3. Los benchmarks deben ser realistas para el nivel de antigüedad detectado

4. Las improvementActions deben tener "before" con texto REAL del CV y "after" con sugerencia concreta

5. El actionPlan debe ser personalizado a las prioridades de este CV específico

6. Los salarios deben ser en ${currency.symbol} (${currency.code}) y realistas para ${marketCtx}

7. Devuelve SOLO el JSON, sin texto adicional

8. TODO el texto debe estar en Español

9. CALIBRACIÓN DE PUNTUACIÓN: Empieza desde 50 (media) y aplica penalizaciones/bonificaciones. La mayoría de los CVs deben puntuar 35-65. Solo CVs verdaderamente excepcionales puntúan por encima de 75. Un CV con descripciones genéricas, sin métricas y estructura básica NUNCA debe puntuar por encima de 55.

10. ANÁLISIS ESPECÍFICO POR ÁREA: DEBES detectar el área profesional del contenido del CV y adaptar TODO a esa área. NUNCA apliques plantillas corporate/business a funciones no corporativas.

11. Las puntuaciones de dimensiones DEBEN tener al menos 10 puntos de diferencia entre la más alta y la más baja. Si todas las dimensiones están dentro de 5 puntos entre sí, estás siendo perezoso — reevalúa.

12. La puntuación global es la MEDIA PONDERADA de dimensiones: Estructura 25% + Contenido 30% + Formación 15% + Experiencia 30%. Calcúlala, no la adivines.

13. TABLA DE REFERENCIA SALARIAL (adapta al mercado, antigüedad y área detectados):

  SALUD: Fisioterapeuta (900-2200), Enfermero (1100-2400), Radiólogo/Técnico (1000-2200), Farmacéutico (1200-2800), Médico/General (2500-5500), Dentista (1500-4000), Psicólogo (900-2500), Nutricionista (800-2000), Logopeda (900-1800), Terapeuta Ocupacional (900-1800)

  EDUCACIÓN: Profesor (1200-2800), Profesor Universitario (1800-4500), Formador/Instructor (800-2000), Educador Infantil (800-1200), Profesor de Educación Especial (1200-2500)

  INGENIERÍA: Ingeniero Civil (1200-3500), Ingeniero Mecánico (1200-3200), Ingeniero Eléctrico (1300-3500), Ingeniero Químico (1300-3500), Ingeniero Ambiental (1100-2800)

  TECNOLOGÍA: Ingeniero de Software (1500-4500), Analista de Datos (1200-3000), Diseñador UX/UI (1200-3000), Soporte IT (900-1800), Ingeniero DevOps (1800-4500), Analista de Ciberseguridad (1500-4000)

  OFICIOS E INDUSTRIA: Electricista (900-1800), Fontanero (800-1600), Mecánico (800-1600), Soldador (800-1500), Operador CNC (900-1600), Operario de Fábrica (800-1200), Inspector de Calidad (1000-2000)

  COMERCIO Y HOSTELERÍA: Dependiente (800-1200), Gerente de Tienda (1100-2000), Chef (900-2500), Camarero (800-1100), Recepcionista de Hotel (800-1400), Guía Turístico (800-1500)

  BUSINESS Y CORPORATE: Gerente de RRHH (2000-5000), Director de RRHH (3500-8000), Gerente de Marketing (1800-4000), Director Financiero (2000-5500), Consultor (1500-4500), Gerente de Proyecto (1500-4000)

  LEGAL: Abogado (1200-5000), Paralegal (900-1800), Notario (2000-5000), Asesor Legal (1500-3500)

  CREATIVO: Diseñador Gráfico (900-2200), Arquitecto (1200-3500), Periodista (900-2200), Fotógrafo (700-1800), Editor de Vídeo (800-2000)

  AGRICULTURA Y MEDIO AMBIENTE: Agrónomo (1000-2500), Veterinario (1200-3000), Técnico Ambiental (900-2000)

  SOCIAL Y PÚBLICO: Trabajador Social (1000-2000), Administrador Público (1200-2800), Bombero (1000-1800), Policía (1100-2000)

  Estos son valores MENSUALES BRUTOS en EUR para Portugal. Escala proporcionalmente para otros mercados.

14. BENEFICIOS POR ÁREA (usa SOLO beneficios típicos del área detectada):

  SALUD: Seguro de responsabilidad profesional, formación médica continua, turnos flexibles, seguro de salud, horas extra pagadas, progresión en la carrera clínica

  EDUCACIÓN: Vacaciones escolares, horario reducido, licencia sabática, becas de investigación, apoyo a la formación

  INGENIERÍA: Coche de empresa (senior), formación técnica, equipo de seguridad, bonos de proyecto, colegiación profesional

  TECNOLOGÍA: Trabajo remoto, stock options, presupuesto de formación, horario flexible, seguro de salud, subsidio de equipamiento

  OFICIOS: Horas extra pagadas, equipo de seguridad, subsidio de herramientas, subsidio de transporte, subsidio de comida

  COMERCIO/HOSTELERÍA: Descuentos en tienda, propinas, subsidio de comida, primas de turno, subsidio de transporte

  CORPORATE: Bono de rendimiento, coche de empresa, stock options, seguro de salud privado, plan de pensiones, gimnasio

  LEGAL: Desarrollo profesional, cuotas colegiales, facturación flexible, vía a socio

  CREATIVO: Tiempo para portafolio, subsidio de equipamiento, horario flexible, apoyo a exposiciones/conferencias

15. RIESGO DE AUTOMATIZACIÓN POR ÁREA (adapta recomendaciones a la profesión real):

  SALUD: Enfócate en habilidades de relación con pacientes, técnicas clínicas especializadas, colaboración interdisciplinar, adaptación a telesalud — NO "liderazgo" o "transformación digital" genéricos

  EDUCACIÓN: Enfócate en innovación pedagógica, participación de alumnos, diseño curricular, integración de EdTech — NO estrategia corporativa

  OFICIOS: Enfócate en certificaciones especializadas, resolución de problemas complejos, experiencia en seguridad, transición energética verde — NO liderazgo de IA y automatización

  COMERCIO: Enfócate en experiencia del cliente, visual merchandising, competencias de e-commerce, gestión de inventario — NO liderazgo ejecutivo

  TECNOLOGÍA: Enfócate en frameworks emergentes, arquitectura cloud, competencias IA/ML, diseño de sistemas — apropiado al área

  CORPORATE: Liderazgo, pensamiento estratégico, transformación digital — SOLO para funciones realmente corporativas

16. KEYWORDS ATS POR ÁREA: Las keywords detectadas y recomendadas DEBEN ser relevantes para el área profesional. Un enfermero necesita "cuidados al paciente, evaluación clínica, administración de medicación" — NO "gestión de stakeholders, ROI, KPIs". Un mecánico necesita "diagnóstico, mantenimiento preventivo, sistemas hidráulicos" — NO "gestión de proyectos, metodología agile". Un fisioterapeuta necesita "rehabilitación, terapia manual, evaluación funcional" — NO "transformación organizacional". Un técnico de radiología necesita "imagenología, protección radiológica, tomografía" — NO "gestión de equipos".` : `Analisa o seguinte CV e retorna um JSON EXACTAMENTE com esta estrutura. CADA campo deve conter análise ESPECÍFICA ao CV — cita secções, frases e dados concretos do CV.



CV:

${sanitized}

${companyContext}

${country ? `MERCADO ALVO: ${getMarketContext(country, region)}\nMOEDA: ${currency.symbol} (${currency.code})` : ''}

RETORNA EXACTAMENTE este JSON (sem texto antes ou depois):

{

  "atsRejectionRate": <número 0-100, probabilidade de rejeição automática por ATS>,

  "atsTopFactor": "<factor principal que mais afecta a compatibilidade ATS DESTE CV específico — cita o problema concreto>",

  "detailedAtsAnalysis": {

    "factors": [

      { "factor": "<nome do factor>", "status": "pass|warning|fail", "detail": "<explicação ESPECÍFICA ao CV — cita secções/elementos concretos>" }

    ],

    "atsSystems": [

      { "name": "Workday", "compatibility": "Excelente|Boa|Fraca" },

      { "name": "SAP SF", "compatibility": "Excelente|Boa|Fraca" },

      { "name": "Taleo", "compatibility": "Excelente|Boa|Fraca" },

      { "name": "Greenhouse", "compatibility": "Excelente|Boa|Fraca" }

    ],

    "quickFixes": ["<fix concreto 1 referindo elemento do CV>", "<fix 2>", "<fix 3>"]

  },

  "quadrants": [

    {

      "title": "Estrutura",

      "score": <0-100>,

      "benchmark": <benchmark para este nível de senioridade>,

      "impactPhrase": "<frase curta e ESPECÍFICA sobre o impacto da estrutura DESTE CV — ex: 'A ausência de secção de certificações e a ordem cronológica inversa inconsistente reduzem a legibilidade'>",

      "strengths": ["<ponto forte específico da estrutura deste CV>"],

      "weaknesses": ["<ponto fraco específico da estrutura deste CV>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre a estrutura: o que está bem, o que falta, secções mal organizadas, formatação — CITA elementos reais do CV>"

    },

    {

      "title": "Conteúdo",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica sobre o conteúdo — ex: 'As descrições de experiência na Deloitte carecem de métricas quantificáveis de impacto'>",

      "strengths": ["<ponto forte específico do conteúdo>"],

      "weaknesses": ["<ponto fraco específico do conteúdo>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre o conteúdo: qualidade das descrições, uso de verbos de acção, métricas, keywords — CITA experiências/secções reais>"

    },

    {

      "title": "Formação",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica — ex: 'O mestrado em GRH é relevante mas faltam certificações técnicas para o nível de senioridade detectado'>",

      "strengths": ["<ponto forte específico da formação>"],

      "weaknesses": ["<ponto fraco específico da formação>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre a formação: graus académicos vs expectativa do mercado, certificações em falta para a área, formação contínua — CITA dados reais>"

    },

    {

      "title": "Experiência",

      "score": <0-100>,

      "benchmark": <benchmark>,

      "impactPhrase": "<frase específica — ex: 'A progressão de Analyst a Senior Manager na Deloitte demonstra crescimento consistente e capacidade de liderança'>",

      "strengths": ["<ponto forte específico da experiência>"],

      "weaknesses": ["<ponto fraco específico da experiência>"],

      "detailed_feedback": "<2-3 frases CONCRETAS sobre a experiência: progressão de carreira, diversidade de funções, relevância das competências adquiridas — CITA empresas e datas reais. NOTA: experiências paralelas ou simultâneas são normais e NÃO devem ser criticadas>"

    }

  ],

  "keywords": ["<keyword 1 detectada no CV>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],

  "perceivedRole": "<função que um recrutador perceberia ao ler este CV — baseada no conteúdo real>",

  "perceivedSeniority": "<Júnior|Pleno|Sénior|Director|C-Level — baseada nos anos e progressão reais>",

  "recruiterDeepAnalysis": {

    "firstImpression": "<o que um recrutador pensa nos primeiros 6 segundos ao ver ESTE CV — sê específico>",

    "redFlags": ["<red flag específica deste CV>"],

    "greenFlags": ["<green flag específica deste CV>"],

    "interviewLikelihood": "<Alta|Média|Baixa>",

    "interviewLikelihoodReason": "<porquê — com referência a elementos concretos do CV>"

  },

  "salaryDetailed": {

    "period": "mensal",

    "currency_code": "${currency.code}",

    "currency_symbol": "${currency.symbol}",

    "percentile25": <inteiro bruto mensal em ${currency.code}>,

    "median": <inteiro bruto mensal em ${currency.code}>,

    "percentile75": <inteiro bruto mensal em ${currency.code}>,

    "topMax": <inteiro bruto mensal em ${currency.code}>,

    "salary_label": "Intervalo salarial bruto mensal em ${currency.symbol} para ${getMarketContext(country, region)} — ex: '${currency.symbol}2.200 – ${currency.symbol}3.500/mês bruto'",

    "benefits": ["<benefício típico 1 para esta função/senioridade>", "<benefício 2>", "<benefício 3>"],

    "benefitsNote": "<nota sobre benefícios típicos para este perfil em ${getMarketContext(country, region)}>",

    "source": "Estimativa baseada em dados de mercado para a função e senioridade detectadas"

  },

  "automationRisk": {

    "percentage": <0-100>,

    "level": "Baixo|Médio|Alto",

    "description": "<análise ESPECÍFICA do risco de automação para ESTA função/área — não genérica>",

    "recommendations": ["<recomendação específica 1 para este perfil>", "<recomendação 2>", "<recomendação 3>"]

  },

  "improvementActions": [

    {

      "action": "<acção concreta de melhoria — ex: 'Reescrever a secção de experiência na Deloitte com métricas'>",

      "impact": <1-10 pontos de impacto estimado>,

      "before": "<texto REAL ou paráfrase do que está no CV actualmente>",

      "after": "<sugestão concreta de como deveria ficar — reescrita real>"

    },

    {

      "action": "<acção 2>",

      "impact": <1-10>,

      "before": "<antes real>",

      "after": "<depois sugerido>"

    },

    {

      "action": "<acção 3>",

      "impact": <1-10>,

      "before": "<antes real>",

      "after": "<depois sugerido>"

    }

  ],

  "actionPlan": [

    {

      "week": "Semana 1-2",

      "title": "<título personalizado baseado na prioridade #1 deste CV>",

      "tasks": ["<tarefa específica 1 para este CV>", "<tarefa 2>", "<tarefa 3>"]

    },

    {

      "week": "Semana 3",

      "title": "<título personalizado baseado na prioridade #2>",

      "tasks": ["<tarefa específica 1>", "<tarefa 2>", "<tarefa 3>"]

    },

    {

      "week": "Semana 4",

      "title": "<título personalizado baseado na prioridade #3>",

      "tasks": ["<tarefa específica 1>", "<tarefa 2>", "<tarefa 3>"]

    }

  ]

}



REGRAS CRÍTICAS:

1. CADA campo deve conter análise ESPECÍFICA ao CV — nunca texto genérico

2. Cita nomes de empresas, funções, datas e secções reais do CV

3. Os benchmarks devem ser realistas para o nível de senioridade detectado

4. As improvementActions devem ter "before" com texto REAL do CV e "after" com sugestão concreta

5. O actionPlan deve ser personalizado às prioridades deste CV específico

6. Os salários devem ser em ${currency.symbol} (${currency.code}) e realistas para ${getMarketContext(country, region)}

7. Responde APENAS com o JSON, sem texto adicional

8. NUNCA critiques sobreposição de datas entre experiências profissionais — é perfeitamente normal ter múltiplos cargos em simultâneo (professores, médicos, consultores, empreendedores, freelancers, cargos paralelos). Isto NÃO é uma inconsistência nem um red flag.

9. NUNCA critiques datas futuras em experiências — podem representar cargos já confirmados que começam em breve.

10. NUNCA uses a palavra "gap" para descrever períodos de transição entre empregos inferiores a 6 meses — são normais no mercado de trabalho.

11. CALIBRAÇÃO DE SCORES: Começa em 50 (média) e aplica penalizações/bónus. A maioria dos CVs deve pontuar 35-65. Só CVs verdadeiramente excepcionais pontuam acima de 75. Um CV com descrições genéricas, sem métricas e estrutura básica NUNCA deve pontuar acima de 55.

12. ANÁLISE ESPECÍFICA POR ÁREA: DEVES detectar a área profissional a partir do conteúdo do CV e adaptar TUDO a essa área. NUNCA apliques templates corporate/business a funções não-corporativas.

13. Os scores das dimensões DEVEM variar pelo menos 10 pontos entre o mais alto e o mais baixo — scores uniformes são PROIBIDOS.

14. O score GLOBAL deve ser a MÉDIA PONDERADA das dimensões: Estrutura 25% + Conteúdo 30% + Formação 15% + Experiência 30%. Calcula-o, não adivinhes.

15. TABELA DE REFERÊNCIA SALARIAL (adapta ao mercado, senioridade e área detectados):

  SAÚDE: Fisioterapeuta (900-2200), Enfermeiro (1100-2400), Técnico de Radiologia (1000-2200), Farmacêutico (1200-2800), Médico/Clínico Geral (2500-5500), Dentista (1500-4000), Psicólogo (900-2500), Nutricionista (800-2000), Terapeuta da Fala (900-1800), Terapeuta Ocupacional (900-1800), Optometrista (900-2000), Técnico de Análises Clínicas (900-1800), Podologista (800-1800)

  EDUCAÇÃO: Professor (1200-2800), Professor Universitário (1800-4500), Formador (800-2000), Educador de Infância (800-1200), Professor de Educação Especial (1200-2500), Explicador (700-1500)

  ENGENHARIA: Engenheiro Civil (1200-3500), Engenheiro Mecânico (1200-3200), Engenheiro Electrotécnico (1300-3500), Engenheiro Químico (1300-3500), Engenheiro Ambiental (1100-2800), Engenheiro Agrónomo (1000-2500)

  TECNOLOGIA: Engenheiro de Software (1500-4500), Analista de Dados (1200-3000), Designer UX/UI (1200-3000), Técnico de Informática (900-1800), DevOps (1800-4500), Cibersegurança (1500-4000), Product Manager (1800-4500)

  OFÍCIOS E INDÚSTRIA: Electricista (900-1800), Canalizador (800-1600), Mecânico (800-1600), Soldador (800-1500), Operador CNC (900-1600), Operário Fabril (800-1200), Inspector de Qualidade (1000-2000), Técnico de Manutenção (900-1800), Serralheiro (800-1500)

  COMÉRCIO E HOTELARIA: Operador de Loja (800-1200), Gerente de Loja (1100-2000), Cozinheiro/Chef (900-2500), Empregado de Mesa (800-1100), Recepcionista de Hotel (800-1400), Guia Turístico (800-1500), Barman (800-1300), Pasteleiro (800-1500)

  BUSINESS E CORPORATE: Gestor de RH (2000-5000), Director de RH (3500-8000), Gestor de Marketing (1800-4000), Director Financeiro (2500-7000), Consultor (1500-4500), Gestor de Projecto (1500-4000), Controller (1500-3500), Auditor (1200-3500)

  DIREITO: Advogado (1200-5000), Solicitador (900-2500), Notário (2000-5000), Consultor Jurídico (1500-3500), Oficial de Justiça (1200-2200)

  CRIATIVO: Designer Gráfico (900-2200), Arquitecto (1200-3500), Jornalista (900-2200), Fotógrafo (700-1800), Editor de Vídeo (800-2000), Ilustrador (700-1800), Músico (600-2000)

  AGRICULTURA E AMBIENTE: Agrónomo (1000-2500), Veterinário (1200-3000), Técnico Ambiental (900-2000), Engenheiro Florestal (1000-2200)

  SOCIAL E PÚBLICO: Assistente Social (1000-2000), Administrador Público (1200-2800), Bombeiro (1000-1800), Polícia (1100-2000), Técnico de Reinserção Social (900-1800)

  TRANSPORTE E LOGÍSTICA: Motorista (800-1500), Piloto (3000-8000), Despachante (900-1600), Gestor de Logística (1200-3000), Operador de Empilhador (800-1200)

  Estes são valores MENSAIS BRUTOS em EUR para Portugal. Escala proporcionalmente para outros mercados.

16. BENEFÍCIOS POR ÁREA (usa APENAS benefícios típicos da área detectada):

  SAÚDE: Seguro de responsabilidade profissional, formação contínua em saúde, turnos flexíveis, seguro de saúde, horas extra pagas, progressão na carreira clínica

  EDUCAÇÃO: Férias escolares, redução de horário, licença sabática, bolsas de investigação, apoio a formação

  ENGENHARIA: Carro da empresa (sénior), formação técnica, equipamento de segurança, bónus de projecto, inscrição na Ordem

  TECNOLOGIA: Trabalho remoto, stock options, budget de formação, horário flexível, seguro de saúde, subsídio de equipamento

  OFÍCIOS: Horas extra pagas, equipamento de segurança, subsídio de ferramentas, subsídio de transporte, subsídio de refeição

  COMÉRCIO/HOTELARIA: Descontos em loja, gorjetas, subsídio de refeição, prémios de turno, subsídio de transporte

  CORPORATE: Bónus de performance, carro da empresa, stock options, seguro de saúde privado, plano de pensões, ginásio

  DIREITO: Desenvolvimento profissional, quotas da Ordem, facturação flexível, via para sócio

  CRIATIVO: Tempo para portfólio, subsídio de equipamento, horário flexível, apoio a exposições/conferências

17. RISCO DE AUTOMAÇÃO POR ÁREA (adapta recomendações à profissão real):

  SAÚDE: Foca em competências de relação com pacientes, técnicas clínicas especializadas, colaboração interdisciplinar, adaptação a telesaúde — NÃO "liderança" ou "transformação digital" genéricas

  EDUCAÇÃO: Foca em inovação pedagógica, envolvimento dos alunos, design curricular, integração de EdTech — NÃO estratégia corporativa

  OFÍCIOS: Foca em certificações especializadas, resolução de problemas complexos, expertise em segurança, transição energética verde — NÃO liderança de IA e automação

  COMÉRCIO: Foca em experiência do cliente, visual merchandising, competências de e-commerce, gestão de inventário — NÃO liderança executiva

  TECNOLOGIA: Foca em frameworks emergentes, arquitectura cloud, competências IA/ML, design de sistemas — apropriado à área

  CORPORATE: Liderança, pensamento estratégico, transformação digital — APENAS para funções realmente corporativas

18. KEYWORDS ATS POR ÁREA: As keywords detectadas e recomendadas DEVEM ser relevantes para a área profissional. Um enfermeiro precisa de "cuidados ao paciente, avaliação clínica, administração de medicação" — NÃO "gestão de stakeholders, ROI, KPIs". Um mecânico precisa de "diagnóstico, manutenção preventiva, sistemas hidráulicos" — NÃO "gestão de projectos, metodologia agile". Um fisioterapeuta precisa de "reabilitação, terapia manual, avaliação funcional" — NÃO "transformação organizacional". Um técnico de radiologia precisa de "imagiologia, proteção radiológica, tomografia" — NÃO "gestão de equipas".`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: systemPrompt

                  }

                ]

              },

              {

                role: 'model',

                parts: [

                  {

                    text: isEN ? 'Understood. I will analyse the CV and return a complete JSON analysis.' : isES ? 'Entendido. Voy a analizar el CV y devolver un JSON con análisis completo.' : 'Compreendido. Vou analisar o CV e retornar JSON com análise completa.'

                  }

                ]

              },

              {

                role: 'user',

                parts: [

                  {

                    text: userPrompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 0.3,

              topK: 40,

              topP: 0.95,

              maxOutputTokens: 16384

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          return jsonResponse({

            success: false,

            error: 'Erro ao chamar Gemini',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        // Check for truncation

        const cvFinishReason = geminiData.candidates?.[0]?.finishReason;

        if (cvFinishReason === 'MAX_TOKENS') {

          console.warn('⚠️ CV Analysis response truncated by MAX_TOKENS — attempting JSON repair');

        }

        let analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').trim();

        // Repair truncated JSON: count braces and close any unclosed ones

        let braceCount = 0;

        let bracketCount = 0;

        let inString = false;

        let escapeNext = false;

        for (const ch of analysisText){

          if (escapeNext) {

            escapeNext = false;

            continue;

          }

          if (ch === '\\') {

            escapeNext = true;

            continue;

          }

          if (ch === '"') {

            inString = !inString;

            continue;

          }

          if (inString) continue;

          if (ch === '{') braceCount++;

          if (ch === '}') braceCount--;

          if (ch === '[') bracketCount++;

          if (ch === ']') bracketCount--;

        }

        // If JSON is truncated, try to close it

        if (braceCount > 0 || bracketCount > 0) {

          console.warn(`⚠️ Repairing truncated CV Analysis JSON: ${braceCount} unclosed braces, ${bracketCount} unclosed brackets`);

          // Remove any trailing incomplete key-value pair

          analysisText = analysisText.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}\[\]]*$/, '');

          // Close brackets and braces

          for(let i = 0; i < bracketCount; i++)analysisText += ']';

          for(let i = 0; i < braceCount; i++)analysisText += '}';

        } else {

          // Normal case: just trim trailing non-JSON

          analysisText = analysisText.replace(/[^}]*$/, '');

        }

        analysisText = analysisText.trim();

        const analysis = JSON.parse(analysisText);

        console.log('✅ Análise Premium gerada');

        return jsonResponse({

          success: true,

          analysis

        });

      } catch (error) {

        console.error('❌ Erro no modo cv_analysis:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao processar análise',

          message: error.message

        }, 500);

      }

    }

    // MODE: Career Coach

    if (mode === 'career_coach') {

      // Extract language from request body (sent by frontend based on page language)

      const chatLang = body.language || body.lang || 'pt';

      const isPT = chatLang === 'pt';

      const isES = chatLang === 'es';

      console.log(`🤖 Modo: Career Coach [lang=${chatLang}]`);

      // Extract additional fields for career coach

      const profileName = body.profile_name || '';

      const profileLinkedin = body.profile_linkedin || '';

      const profileCvText = body.profile_cv_text || cvText || '';

      const coverLetterMode = body.cover_letter === true;

      const targetCompany = body.target_company || '';

      const targetRole = body.target_role || '';

      const userId = body.user_id || '';

      if (!message && !coverLetterMode) {

        return jsonResponse({

          success: false,

          error: isPT ? 'Parâmetro "message" obrigatório' : 'Parameter "message" is required'

        }, 400);

      }

      try {

        // ===== FETCH USER DATA FROM SUPABASE =====

        let profileContext = '';

        if (userId) {

          console.log(`📊 Career Coach: A carregar dados do utilizador ${userId}`);

          const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

          const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

          if (supabaseServiceKey) {

            const supabase = createClient(supabaseUrl, supabaseServiceKey);

            // Step 1: Get user profile - try by user_id first, then by auth.users id match

            let userProfile = null;

            let userEmail = '';

            // Try to find profile by user_id

            const profileByUserId = await supabase.from('user_profiles').select('first_name, last_name, email, linkedin_url, job_area, job_country, job_region, job_work_mode, cv_filename').eq('user_id', userId).maybeSingle();

            if (profileByUserId.data) {

              userProfile = profileByUserId.data;

              userEmail = userProfile.email || '';

            } else {

              // Fallback: get email from auth.users, then find profile by email

              const { data: authUser } = await supabase.auth.admin.getUserById(userId);

              if (authUser?.user?.email) {

                userEmail = authUser.user.email;

                const profileByEmail = await supabase.from('user_profiles').select('first_name, last_name, email, linkedin_url, job_area, job_country, job_region, job_work_mode, cv_filename').eq('email', userEmail).maybeSingle();

                if (profileByEmail.data) {

                  userProfile = profileByEmail.data;

                }

              }

            }

            console.log(`📊 Career Coach: userEmail=${userEmail}, hasProfile=${!!userProfile}`);

            // Step 2: Fetch all other data in parallel - use both user_id and email for maximum coverage

            const [cvByIdRes, cvByEmailRes, linkedinByIdRes, linkedinByEmailRes, careerEnergyRes, savedJobsRes] = await Promise.all([

              // CV analysis by user_id

              supabase.from('cv_analysis').select('cv_text, analysis_result, score, professional_area, linkedin_url, created_at').eq('user_id', userId).order('created_at', {

                ascending: false

              }).limit(3),

              // CV analysis by email (fallback)

              userEmail ? supabase.from('cv_analysis').select('cv_text, analysis_result, score, professional_area, linkedin_url, created_at').eq('user_email', userEmail).order('created_at', {

                ascending: false

              }).limit(3) : Promise.resolve({

                data: []

              }),

              // LinkedIn analysis by user_id

              supabase.from('linkedin_roaster_analyses').select('profile_text, analysis_json, teaser_score, linkedin_url, created_at').eq('user_id', userId).order('created_at', {

                ascending: false

              }).limit(1),

              // LinkedIn analysis by email (fallback)

              userEmail ? supabase.from('linkedin_roaster_analyses').select('profile_text, analysis_json, teaser_score, linkedin_url, created_at').eq('user_email', userEmail).order('created_at', {

                ascending: false

              }).limit(1) : Promise.resolve({

                data: []

              }),

              // Career Energy by user_id

              supabase.from('career_energy_results').select('total_score, level_label, dim_energy, dim_clarity, dim_positioning, dim_purpose, role, experience, country_name, created_at').eq('user_id', userId).order('created_at', {

                ascending: false

              }).limit(1),

              // Saved jobs by user_id (these always have user_id)

              supabase.from('saved_jobs').select('title, company, location, salary, employment_type, status, notes').eq('user_id', userId).order('created_at', {

                ascending: false

              }).limit(5)

            ]);

            // Merge results: prefer user_id matches, fallback to email matches

            const cvAnalyses = cvByIdRes.data && cvByIdRes.data.length > 0 ? cvByIdRes.data : cvByEmailRes.data || [];

            const linkedinAnalysis = linkedinByIdRes.data && linkedinByIdRes.data.length > 0 ? linkedinByIdRes.data[0] : linkedinByEmailRes.data?.[0] || null;

            const careerEnergy = careerEnergyRes.data?.[0];

            const savedJobs = savedJobsRes.data || [];

            const hasData = userProfile || cvAnalyses.length > 0 || linkedinAnalysis || careerEnergy || savedJobs.length > 0;

            if (hasData) {

              profileContext = isPT ? `\n\nCONTEXTO COMPLETO DO UTILIZADOR (dados reais da plataforma Share2Inspire):` : `\n\nCOMPLETE USER CONTEXT (real data from Share2Inspire platform):`;

              // --- User Profile ---

              if (userProfile) {

                const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim();

                profileContext += isPT ? `\n\n--- PERFIL ---` : `\n\n--- PROFILE ---`;

                if (fullName) profileContext += isPT ? `\nNome: ${fullName}` : `\nName: ${fullName}`;

                if (userProfile.email) profileContext += `\nEmail: ${userProfile.email}`;

                if (userProfile.linkedin_url) profileContext += `\nLinkedIn: ${userProfile.linkedin_url}`;

                if (userProfile.job_area) profileContext += isPT ? `\nÁrea profissional pretendida: ${userProfile.job_area}` : `\nTarget job area: ${userProfile.job_area}`;

                if (userProfile.job_country) profileContext += isPT ? `\nPaís-alvo: ${userProfile.job_country}` : `\nTarget country: ${userProfile.job_country}`;

                if (userProfile.job_region) profileContext += isPT ? `\nRegião: ${userProfile.job_region}` : `\nRegion: ${userProfile.job_region}`;

                if (userProfile.job_work_mode) profileContext += isPT ? `\nModo de trabalho: ${userProfile.job_work_mode}` : `\nWork mode: ${userProfile.job_work_mode}`;

                if (userProfile.cv_filename) profileContext += isPT ? `\nCV carregado: ${userProfile.cv_filename}` : `\nCV uploaded: ${userProfile.cv_filename}`;

              }

              // --- CV Analysis (most recent) ---

              if (cvAnalyses.length > 0) {

                const latestCv = cvAnalyses[0];

                profileContext += isPT ? `\n\n--- ANÁLISE DE CV (mais recente) ---` : `\n\n--- CV ANALYSIS (most recent) ---`;

                if (latestCv.score) profileContext += isPT ? `\nScore geral: ${latestCv.score}/1000` : `\nOverall score: ${latestCv.score}/1000`;

                if (latestCv.professional_area) profileContext += isPT ? `\nÁrea profissional detectada: ${latestCv.professional_area}` : `\nDetected professional area: ${latestCv.professional_area}`;

                // Extract key insights from analysis_result if it's JSON

                if (latestCv.analysis_result) {

                  try {

                    const analysis = typeof latestCv.analysis_result === 'string' ? JSON.parse(latestCv.analysis_result) : latestCv.analysis_result;

                    if (analysis.executive_summary) {

                      const summary = typeof analysis.executive_summary === 'string' ? analysis.executive_summary : JSON.stringify(analysis.executive_summary);

                      profileContext += isPT ? `\nResumo executivo: ${summary.substring(0, 500)}` : `\nExecutive summary: ${summary.substring(0, 500)}`;

                    }

                    if (analysis.strengths) {

                      const strengths = Array.isArray(analysis.strengths) ? analysis.strengths.join(', ') : String(analysis.strengths);

                      profileContext += isPT ? `\nPontos fortes: ${strengths.substring(0, 300)}` : `\nStrengths: ${strengths.substring(0, 300)}`;

                    }

                    if (analysis.improvements || analysis.areas_to_improve) {

                      const improvements = Array.isArray(analysis.improvements || analysis.areas_to_improve) ? (analysis.improvements || analysis.areas_to_improve).join(', ') : String(analysis.improvements || analysis.areas_to_improve);

                      profileContext += isPT ? `\nÁreas a melhorar: ${improvements.substring(0, 300)}` : `\nAreas to improve: ${improvements.substring(0, 300)}`;

                    }

                  } catch (e) {

                  // analysis_result is not parseable, skip

                  }

                }

                // Include CV text (truncated) for content generation

                if (latestCv.cv_text) {

                  profileContext += isPT ? `\nTexto do CV:\n${latestCv.cv_text.substring(0, 3000)}` : `\nCV text:\n${latestCv.cv_text.substring(0, 3000)}`;

                }

                if (cvAnalyses.length > 1) {

                  profileContext += isPT ? `\n(${cvAnalyses.length} análises de CV no total)` : `\n(${cvAnalyses.length} CV analyses total)`;

                }

              }

              // --- LinkedIn Analysis ---

              if (linkedinAnalysis) {

                profileContext += isPT ? `\n\n--- ANÁLISE LINKEDIN ---` : `\n\n--- LINKEDIN ANALYSIS ---`;

                if (linkedinAnalysis.teaser_score) profileContext += isPT ? `\nScore LinkedIn: ${linkedinAnalysis.teaser_score}` : `\nLinkedIn score: ${linkedinAnalysis.teaser_score}`;

                if (linkedinAnalysis.linkedin_url) profileContext += `\nURL: ${linkedinAnalysis.linkedin_url}`;

                if (linkedinAnalysis.analysis_json) {

                  try {

                    const liAnalysis = typeof linkedinAnalysis.analysis_json === 'string' ? JSON.parse(linkedinAnalysis.analysis_json) : linkedinAnalysis.analysis_json;

                    if (liAnalysis.headline_feedback) profileContext += isPT ? `\nFeedback headline: ${String(liAnalysis.headline_feedback).substring(0, 200)}` : `\nHeadline feedback: ${String(liAnalysis.headline_feedback).substring(0, 200)}`;

                    if (liAnalysis.summary_feedback || liAnalysis.about_feedback) {

                      const aboutFb = String(liAnalysis.summary_feedback || liAnalysis.about_feedback).substring(0, 200);

                      profileContext += isPT ? `\nFeedback sobre: ${aboutFb}` : `\nAbout feedback: ${aboutFb}`;

                    }

                    if (liAnalysis.overall_impression) profileContext += isPT ? `\nImpressão geral: ${String(liAnalysis.overall_impression).substring(0, 200)}` : `\nOverall impression: ${String(liAnalysis.overall_impression).substring(0, 200)}`;

                  } catch (e) {

                  // analysis_json not parseable

                  }

                }

                if (linkedinAnalysis.profile_text) {

                  profileContext += isPT ? `\nTexto do perfil LinkedIn:\n${linkedinAnalysis.profile_text.substring(0, 1500)}` : `\nLinkedIn profile text:\n${linkedinAnalysis.profile_text.substring(0, 1500)}`;

                }

              }

              // --- Career Energy ---

              if (careerEnergy) {

                profileContext += isPT ? `\n\n--- CAREER ENERGY ---` : `\n\n--- CAREER ENERGY ---`;

                if (careerEnergy.total_score) profileContext += isPT ? `\nScore total: ${careerEnergy.total_score}/100 (${careerEnergy.level_label || ''})` : `\nTotal score: ${careerEnergy.total_score}/100 (${careerEnergy.level_label || ''})`;

                if (careerEnergy.dim_energy) profileContext += isPT ? `\nEnergia: ${careerEnergy.dim_energy}/25` : `\nEnergy: ${careerEnergy.dim_energy}/25`;

                if (careerEnergy.dim_clarity) profileContext += isPT ? `\nClareza: ${careerEnergy.dim_clarity}/25` : `\nClarity: ${careerEnergy.dim_clarity}/25`;

                if (careerEnergy.dim_positioning) profileContext += isPT ? `\nPosicionamento: ${careerEnergy.dim_positioning}/25` : `\nPositioning: ${careerEnergy.dim_positioning}/25`;

                if (careerEnergy.dim_purpose) profileContext += isPT ? `\nPropósito: ${careerEnergy.dim_purpose}/25` : `\nPurpose: ${careerEnergy.dim_purpose}/25`;

                if (careerEnergy.role) profileContext += isPT ? `\nFunção atual: ${careerEnergy.role}` : `\nCurrent role: ${careerEnergy.role}`;

                if (careerEnergy.experience) profileContext += isPT ? `\nExperiência: ${careerEnergy.experience}` : `\nExperience: ${careerEnergy.experience}`;

              }

              // --- Saved Jobs ---

              if (savedJobs.length > 0) {

                profileContext += isPT ? `\n\n--- VAGAS GUARDADAS (${savedJobs.length} mais recentes) ---` : `\n\n--- SAVED JOBS (${savedJobs.length} most recent) ---`;

                for (const job of savedJobs){

                  const jobLine = `${job.title || '?'} @ ${job.company || '?'} | ${job.location || '?'} | ${job.salary || 'salário n/d'} | Status: ${job.status || 'guardada'}`;

                  profileContext += `\n- ${jobLine}`;

                  if (job.notes) profileContext += ` (${isPT ? 'Notas' : 'Notes'}: ${job.notes.substring(0, 100)})`;

                }

              }

              console.log(`✅ Career Coach: Contexto do utilizador carregado (${profileContext.length} chars)`);

            }

          } else {

            console.warn('⚠️ Career Coach: SUPABASE_SERVICE_ROLE_KEY não disponível, a usar dados do body');

          }

        }

        // Fallback: if no data from DB, use data sent by frontend

        if (!profileContext && (profileName || profileCvText || profileLinkedin)) {

          profileContext = isPT ? `\n\nCONTEXTO DO PERFIL DO UTILIZADOR:` : `\n\nUSER PROFILE CONTEXT:`;

          if (profileName) profileContext += isPT ? `\nNome: ${profileName}` : `\nName: ${profileName}`;

          if (profileLinkedin) profileContext += `\nLinkedIn: ${profileLinkedin}`;

          if (profileCvText) profileContext += isPT ? `\nCV/Experiência:\n${profileCvText.substring(0, 4000)}` : `\nCV/Experience:\n${profileCvText.substring(0, 4000)}`;

        }

        let systemPrompt;

        let userMessage;

        let maxTokens = 2048;

        // Gemini: Try to enrich chat with company data if user mentions a company

        let chatCompanyContext = '';

        const chatTargetCompany = body.target_company || '';

        if (chatTargetCompany || (message && extractCompanyNames(message).length > 0)) {

          const companyToEnrich = chatTargetCompany || extractCompanyNames(message)[0];

          try {

            const chatCompanyDetails = await fetchCompanyDetails(companyToEnrich);

            if (chatCompanyDetails) {

              const isPTChat = body.language === 'pt' || body.lang === 'pt';

              chatCompanyContext = isPTChat

                ? `\n\n--- DADOS DA EMPRESA MENCIONADA (Gemini) ---\nEmpresa: ${chatCompanyDetails.name}\n${chatCompanyDetails.industry ? `Indústria: ${chatCompanyDetails.industry}\n` : ''}${chatCompanyDetails.employee_count ? `Dimensão: ${chatCompanyDetails.employee_count.toLocaleString()} funcionários\n` : ''}${chatCompanyDetails.specialties?.length ? `Especialidades: ${chatCompanyDetails.specialties.join(', ')}\n` : ''}${chatCompanyDetails.description ? `Descrição: ${chatCompanyDetails.description.substring(0, 300)}\n` : ''}USA estes dados de forma natural nas tuas respostas quando relevante. Não despejes os dados em bruto.\n---`

                : `\n\n--- MENTIONED COMPANY DATA (Gemini) ---\nCompany: ${chatCompanyDetails.name}\n${chatCompanyDetails.industry ? `Industry: ${chatCompanyDetails.industry}\n` : ''}${chatCompanyDetails.employee_count ? `Size: ${chatCompanyDetails.employee_count.toLocaleString()} employees\n` : ''}${chatCompanyDetails.specialties?.length ? `Specialties: ${chatCompanyDetails.specialties.join(', ')}\n` : ''}${chatCompanyDetails.description ? `Description: ${chatCompanyDetails.description.substring(0, 300)}\n` : ''}USE this data naturally in your responses when relevant. Do not dump raw data.\n---`;

              console.log(`✅ Gemini: Career Coach chat enriched for ${chatCompanyDetails.name}`);

            }

          } catch (e) {

            console.warn('Gemini career coach chat enrichment failed:', e.message);

          }

        }

        // Detect content generation requests (posts, emails, headlines, etc.) that need more tokens

        const msgLower = (message || '').toLowerCase();

        const isContentGeneration = msgLower.includes('carta de apresentação') || msgLower.includes('cover letter') || msgLower.includes('post linkedin') || msgLower.includes('e-mail de networking') || msgLower.includes('email de networking') || msgLower.includes('networking email') || msgLower.includes('recommendation letter') || msgLower.includes('carta de recomendação') || msgLower.includes('headline') || msgLower.includes('gera ') || msgLower.includes('escreve ') || msgLower.includes('generate') || msgLower.includes('write') || msgLower.includes('prepare') || msgLower.includes('prepara') || msgLower.includes('estratégia') || msgLower.includes('strategy') || msgLower.includes('negoci') || msgLower.includes('negotiat') || msgLower.includes('template') || msgLower.includes('pt-pt') || msgLower.includes('interview');

        if (isContentGeneration) {

          maxTokens = 4096;

          console.log('📝 Career Coach: Content generation detected, maxTokens=4096');

        }

        if (coverLetterMode && targetCompany && targetRole) {

          // COVER LETTER GENERATION MODE

          console.log(`📝 Career Coach: Gerar carta de apresentação para ${targetCompany} - ${targetRole} [lang=${chatLang}]`);

          maxTokens = 4096;

          // Gemini: Enrich cover letter with real company data (single call — details + competitors)

          let coverLetterCompanyContext = '';

          try {

            const { details: clCompanyDetails, competitors: clCompetitors } = await fetchCompanyWithCompetitors(targetCompany);

            if (clCompanyDetails) {

              coverLetterCompanyContext = isPT

                ? `\n\n--- DADOS VERIFICADOS DA EMPRESA-ALVO (Gemini) ---\nEmpresa: ${clCompanyDetails.name}\n${clCompanyDetails.description ? `Descrição: ${clCompanyDetails.description.substring(0, 400)}\n` : ''}${clCompanyDetails.industry ? `Indústria: ${clCompanyDetails.industry}\n` : ''}${clCompanyDetails.employee_count != null ? `Dimensão: ${clCompanyDetails.employee_count.toLocaleString()} funcionários\n` : ''}${clCompanyDetails.specialties?.length ? `Especialidades: ${clCompanyDetails.specialties.join(', ')}\n` : ''}${clCompanyDetails.hq ? `Sede: ${clCompanyDetails.hq}\n` : ''}${clCompanyDetails.founded_year ? `Fundada: ${clCompanyDetails.founded_year}\n` : ''}${clCompanyDetails.tagline ? `Tagline: ${clCompanyDetails.tagline}\n` : ''}${clCompetitors.length > 0 ? `Concorrentes: ${clCompetitors.join(', ')}\n` : ''}\nUSA estes dados para personalizar a carta: menciona a indústria, especialidades ou missão da empresa de forma natural no parágrafo de motivação. Demonstra que o candidato conhece a empresa.\n---`

                : `\n\n--- VERIFIED TARGET COMPANY DATA (Gemini) ---\nCompany: ${clCompanyDetails.name}\n${clCompanyDetails.description ? `Description: ${clCompanyDetails.description.substring(0, 400)}\n` : ''}${clCompanyDetails.industry ? `Industry: ${clCompanyDetails.industry}\n` : ''}${clCompanyDetails.employee_count != null ? `Size: ${clCompanyDetails.employee_count.toLocaleString()} employees\n` : ''}${clCompanyDetails.specialties?.length ? `Specialties: ${clCompanyDetails.specialties.join(', ')}\n` : ''}${clCompanyDetails.hq ? `HQ: ${clCompanyDetails.hq}\n` : ''}${clCompanyDetails.founded_year ? `Founded: ${clCompanyDetails.founded_year}\n` : ''}${clCompanyDetails.tagline ? `Tagline: ${clCompanyDetails.tagline}\n` : ''}${clCompetitors.length > 0 ? `Competitors: ${clCompetitors.join(', ')}\n` : ''}\nUSE this data to personalise the letter: mention the company's industry, specialties or mission naturally in the motivation paragraph. Show the candidate knows the company.\n---`;

              console.log(`✅ Gemini: Cover letter enriched for ${clCompanyDetails.name}`);

            }

          } catch (e) {

            console.warn('Gemini cover letter enrichment failed:', e.message);

          }

          if (isPT) {

            systemPrompt = `És um especialista em recrutamento e cartas de apresentação profissionais. Usas PT-PT (nunca gerúndios brasileiros). Tens acesso ao perfil profissional do candidato e deves gerar uma carta de apresentação personalizada, convincente e profissional.



REGRAS:

1. A carta deve ser em português de Portugal (PT-PT).

2. Tom profissional mas com personalidade — não genérico.

3. Destacar competências e experiências do CV que sejam relevantes para a vaga.

4. Estrutura: Saudação → Parágrafo de abertura (motivação) → 2-3 parágrafos de corpo (valor que traz) → Fecho forte.

5. Máximo 400 palavras.

6. Se não tiveres dados suficientes do CV, pede ao utilizador para fornecer mais contexto.

7. Formata a carta com parágrafos claros, pronta a copiar.

8. Se tiveres dados da empresa-alvo abaixo, USA-OS para demonstrar que o candidato pesquisou a empresa — menciona a indústria, missão ou especialidades de forma natural (não como lista de dados). Isto diferencia a carta de uma carta genérica.${coverLetterCompanyContext}${profileContext}`;

            userMessage = message || `Gera uma carta de apresentação para a empresa ${targetCompany}, para a vaga de ${targetRole}. Usa o meu perfil profissional para personalizar.`;

          } else if (isES) {

            systemPrompt = `Eres un experto en reclutamiento y cartas de presentación profesionales. Tienes acceso al perfil profesional del candidato y debes generar una carta de presentación personalizada, convincente y profesional.
REGLAS:
1. La carta debe estar en Español.
2. Tono profesional con personalidad — no genérico.
3. Destacar competencias y experiencias del CV que sean relevantes para el puesto.
4. Estructura: Saludo → Párrafo de apertura (motivación) → 2-3 párrafos de cuerpo (valor que aporta) → Cierre fuerte.
5. Máximo 400 palabras.
6. Si no tienes suficientes datos del CV, pide al usuario que proporcione más contexto.
7. Formatea la carta con párrafos claros, lista para copiar.${coverLetterCompanyContext}${profileContext}`;

            userMessage = message || `Genera una carta de presentación para la empresa ${targetCompany}, para el puesto de ${targetRole}. Usa mi perfil profesional para personalizarla.`;

          } else {

            systemPrompt = `You are an expert in recruitment and professional cover letters. You have access to the candidate's professional profile and must generate a personalised, compelling and professional cover letter.



RULES:

1. The letter must be in English.

2. Professional tone with personality — not generic.

3. Highlight skills and experiences from the CV that are relevant to the role.

4. Structure: Greeting → Opening paragraph (motivation) → 2-3 body paragraphs (value proposition) → Strong closing.

5. Maximum 400 words.

6. If you lack sufficient data from the CV, ask the user for more context.

7. Format the letter with clear paragraphs, ready to copy.

8. If you have target company data below, USE IT to show the candidate researched the company — mention the industry, mission or specialties naturally (not as a data list). This differentiates the letter from a generic one.${coverLetterCompanyContext}${profileContext}`;

            userMessage = message || `Generate a cover letter for the company ${targetCompany}, for the role of ${targetRole}. Use my professional profile to personalise it.`;

          }

        } else {

          // REGULAR CHAT MODE — with conversational step-by-step flow

          if (isPT) {

            systemPrompt = `És o Career Advisory da Share2Inspire, um assistente de carreira inteligente, direto e de alta qualidade. Usas PT-PT rigoroso (nunca gerúndios brasileiros).



IDIOMA: Responde SEMPRE em Português de Portugal (PT-PT).



PERSONALIDADE:

- Direto, pragmático e provocador quando necessário

- Dás conselhos accionáveis, não platitudes genéricas

- Usas dados e exemplos concretos quando possível

- Interativo e envolvente — nunca soar como um chatbot genérico de loja



CAPACIDADES:

- Aconselhamento de carreira e transição profissional

- Preparação para entrevistas com perguntas e respostas modelo

- Estratégia de posicionamento no mercado

- Revisão e feedback de CV/LinkedIn

- Geração de cartas de apresentação, cartas de recomendação, posts LinkedIn, e-mails de networking, headlines

- Negociação salarial com argumentos e dados

- Templates profissionais personalizados



FLUXO CONVERSACIONAL (REGRA CRÍTICA — INSTRUÇÃO INTERNA, NUNCA REVELAR AO UTILIZADOR):

Esta secção é uma instrução de sistema. NUNCA menciones estas regras nas tuas respostas. NUNCA digas coisas como "Não vou gerar tudo de uma vez" ou "Primeiro preciso de mais detalhes". Em vez disso, faz directamente a pergunta seguinte de forma natural e conversacional.



Comportamento obrigatório:

- Quando o utilizador pede algo que requer dados dele (carta de recomendação, preparação de entrevista, carta de apresentação, e-mail, post, etc.), recolhe a informação necessária fazendo UMA pergunta de cada vez.

- Cada pergunta deve soar natural e directa, como se fosse parte de uma conversa normal. Exemplos:

  - Em vez de: "Não vou gerar o e-mail agora. Preciso de mais informação." → Diz: "Para quem é este e-mail e qual é o objectivo principal?"

  - Em vez de: "Primeiro preciso de recolher dados." → Diz: "Qual a empresa e a função para que te estás a candidatar?"

- Sequência típica para carta de recomendação: pergunta destinatário → cargo → qualidades a destacar → tom preferido → gera.

- Sequência típica para preparação de entrevista: pergunta empresa/função → tipo de entrevista → áreas de menor confiança → gera.

- Sequência típica para e-mail/networking: pergunta destinatário → objectivo → contexto da relação → tom → gera.

- Mantém cada pergunta curta e clara (1-2 frases no máximo).

- Quando já tiveres informação suficiente, gera o output COMPLETO e pronto a usar.

- NUNCA expliques o teu processo interno ao utilizador. Apenas faz as perguntas e depois gera o resultado.



REGRAS DE GERAÇÃO DE CONTEÚDO:

- Quando finalmente geras conteúdo (post, e-mail, carta, headline), gera o conteúdo COMPLETO e pronto a usar

- Nunca cortes o conteúdo a meio — entrega sempre o texto completo

- Usa formatação clara com parágrafos separados

- Adapta o tom ao pedido do utilizador

- Para chat normal (perguntas simples, conselhos), respostas concisas (3-4 parágrafos máximo)



USO INTELIGENTE DOS DADOS DO UTILIZADOR:

- Tens acesso ao contexto completo do utilizador abaixo (perfil, CV, análises, vagas guardadas, Career Energy).

- USA estes dados proactivamente para personalizar TODAS as respostas — não perguntes informação que já tens.

- Quando o utilizador pedir uma carta de apresentação, e-mail ou post, usa o nome, experiência, competências e área do CV automaticamente.

- Se o utilizador tem vagas guardadas, referencia-as quando relevante (ex: "Vi que guardaste a vaga de X na empresa Y...").

- Se tem análise de CV com score e pontos fortes/fracos, usa essa informação nos conselhos.

- Se tem Career Energy, usa os scores dimensionais para dar conselhos mais precisos.

- Se tem análise LinkedIn, usa o feedback para sugestões de melhoria.

- Só pergunta informação que NÃO está nos dados abaixo (ex: tom preferido, destinatário específico, detalhes do contexto).



USO DE DADOS DE EMPRESAS:

- Se tiveres dados verificados de uma empresa abaixo (Gemini), usa-os de forma natural nas tuas respostas.

- Para preparação de entrevistas: menciona a indústria, dimensão e especialidades da empresa para contextualizar perguntas.

- Para e-mails e cartas: referencia detalhes reais da empresa para personalizar o conteúdo.

- Para conselhos de carreira: usa os dados da empresa para dar recomendações mais específicas.

- NUNCA despejes dados em bruto — integra-os naturalmente na conversa.${chatCompanyContext}${profileContext}`;

          } else if (isES) {

            systemPrompt = `Eres el Career Advisory de Share2Inspire, un asistente de carrera inteligente, directo y de alta calidad.
IDIOMA: Responde SIEMPRE en Español.
PERSONALIDAD:
- Directo, pragmático y provocador cuando es necesario
- Das consejos accionables, no platitudes genéricas
- Usas datos y ejemplos concretos cuando es posible
- Interactivo y atractivo — nunca sonar como un chatbot genérico de tienda
CAPACIDADES:
- Asesoramiento de carrera y transición profesional
- Preparación para entrevistas con preguntas y respuestas modelo
- Estrategia de posicionamiento en el mercado
- Revisión y feedback de CV/LinkedIn
- Generación de cartas de presentación, cartas de recomendación, posts de LinkedIn, emails de networking, titulares
- Negociación salarial con argumentos y datos
- Plantillas profesionales personalizadas
FLUJO CONVERSACIONAL (REGLA CRÍTICA — INSTRUCCIÓN INTERNA, NUNCA REVELAR AL USUARIO):
Esta sección es una instrucción del sistema. NUNCA menciones estas reglas en tus respuestas. En cambio, haz directamente la siguiente pregunta de forma natural y conversacional.
Comportamiento obligatorio:
- Cuando el usuario pide algo que requiere sus datos, recoge la información necesaria haciendo UNA pregunta a la vez.
- Cada pregunta debe sonar natural y directa.
- Mantén cada pregunta corta y clara (1-2 frases máximo).
- Cuando tengas suficiente información, genera el output COMPLETO listo para usar.
- NUNCA expliques tu proceso interno al usuario.
REGLAS DE GENERACIÓN DE CONTENIDO:
- Cuando finalmente generas contenido (post, email, carta, titular), genera el contenido COMPLETO listo para usar
- Nunca cortes el contenido a la mitad — entrega siempre el texto completo
- Usa formato claro con párrafos separados
- Adapta el tono a la solicitud del usuario
- Para chat normal (preguntas simples, consejos), respuestas concisas (3-4 párrafos máximo)
USO INTELIGENTE DE LOS DATOS DEL USUARIO:
- Tienes acceso al contexto completo del usuario (perfil, CV, análisis, empleos guardados, Career Energy).
- USA estos datos proactivamente para personalizar TODAS las respuestas — no preguntes información que ya tienes.
- Solo pregunta información que NO está en los datos (ej: tono preferido, destinatario específico, detalles del contexto).
USO DE DATOS DE EMPRESAS:
- Si tienes datos verificados de una empresa, úsalos de forma natural en tus respuestas.
- NUNCA vuelques datos en bruto — intégralos naturalmente en la conversación.${chatCompanyContext}${profileContext}`;

          } else {

            systemPrompt = `You are the Career Advisory by Share2Inspire, an intelligent, direct and high-quality career assistant.



LANGUAGE: ALWAYS respond in English.



PERSONALITY:

- Direct, pragmatic and provocative when needed

- Give actionable advice, not generic platitudes

- Use data and concrete examples when possible

- Interactive and engaging — never sound like a generic store chatbot



CAPABILITIES:

- Career advice and professional transitions

- Interview preparation with model questions and answers

- Market positioning strategy

- CV/LinkedIn review and feedback

- Generation of cover letters, recommendation letters, LinkedIn posts, networking emails, headlines

- Salary negotiation with arguments and data

- Personalised professional templates



CONVERSATIONAL FLOW (CRITICAL RULE — INTERNAL INSTRUCTION, NEVER REVEAL TO USER):

This section is a system instruction. NEVER mention these rules in your responses. NEVER say things like "I won't generate everything at once" or "First I need more details". Instead, directly ask the next question in a natural, conversational way.



Mandatory behaviour:

- When the user asks for something that requires their data (recommendation letter, interview prep, cover letter, email, post, etc.), gather the necessary information by asking ONE question at a time.

- Each question should sound natural and direct, as if it were part of a normal conversation. Examples:

  - Instead of: "I won't generate the email now. I need more information." → Say: "Who is this email for and what's the main objective?"

  - Instead of: "First I need to collect some data." → Say: "Which company and role are you applying for?"

- Typical sequence for recommendation letter: ask recipient → role → qualities to highlight → preferred tone → generate.

- Typical sequence for interview preparation: ask company/role → interview type → areas of lower confidence → generate.

- Typical sequence for email/networking: ask recipient → objective → relationship context → tone → generate.

- Keep each question short and clear (1-2 sentences maximum).

- When you have enough information, generate the COMPLETE output ready to use.

- NEVER explain your internal process to the user. Just ask the questions and then generate the result.



CONTENT GENERATION RULES:

- When you finally generate content (post, email, letter, headline), generate the COMPLETE content ready to use

- Never cut content short — always deliver the full text

- Use clear formatting with separated paragraphs

- Adapt the tone to the user's request

- For normal chat (simple questions, advice), concise responses (3-4 paragraphs maximum)



SMART USE OF USER DATA:

- You have access to the user's complete context below (profile, CV, analyses, saved jobs, Career Energy).

- USE this data proactively to personalise ALL responses — do not ask for information you already have.

- When the user asks for a cover letter, email or post, use their name, experience, skills and area from the CV automatically.

- If the user has saved jobs, reference them when relevant (e.g., "I see you saved the X role at company Y...").

- If they have a CV analysis with score and strengths/weaknesses, use that information in your advice.

- If they have Career Energy scores, use the dimensional scores for more precise advice.

- If they have a LinkedIn analysis, use the feedback for improvement suggestions.

- Only ask for information that is NOT in the data below (e.g., preferred tone, specific recipient, context details).



USING COMPANY DATA:

- If you have verified company data below (Gemini), use it naturally in your responses.

- For interview prep: mention the company's industry, size and specialties to contextualise questions.

- For emails and letters: reference real company details to personalise content.

- For career advice: use company data to give more specific recommendations.

- NEVER dump raw data — weave it naturally into the conversation.${chatCompanyContext}${profileContext}`;

          }

          userMessage = message;

        }

        const conversationHistory = history || [];

        const modelAck = isPT ? 'Compreendido. Sou o Career Advisory da Share2Inspire. Estou pronto para ajudar.' : isES ? 'Entendido. Soy el Career Advisory de Share2Inspire. Estoy listo para ayudar.' : 'Understood. I am the Career Advisory by Share2Inspire. Ready to help.';

        const contents = [

          {

            role: 'user',

            parts: [

              {

                text: systemPrompt

              }

            ]

          },

          {

            role: 'model',

            parts: [

              {

                text: modelAck

              }

            ]

          },

          ...conversationHistory.map((msg)=>({

              role: msg.role === 'user' ? 'user' : 'model',

              parts: [

                {

                  text: msg.content

                }

              ]

            })),

          {

            role: 'user',

            parts: [

              {

                text: userMessage

              }

            ]

          }

        ];

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents,

            generationConfig: {

              temperature: coverLetterMode ? 0.5 : 0.7,

              topK: 40,

              topP: 0.95,

              maxOutputTokens: maxTokens

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          return jsonResponse({

            success: false,

            error: isPT ? 'Erro ao chamar Gemini' : 'Error calling Gemini',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || (isPT ? 'Desculpa, não consegui processar.' : 'Sorry, I could not process that.');

        console.log(`✅ Resposta Career Coach gerada (cover_letter=${coverLetterMode}, lang=${chatLang})`);

        return jsonResponse({

          success: true,

          reply,

          type: coverLetterMode ? 'cover_letter' : 'chat'

        });

      } catch (error) {

        console.error('❌ Erro no modo career_coach:', error);

        return jsonResponse({

          success: false,

          error: isPT ? 'Erro ao processar mensagem' : 'Error processing message',

          message: error.message

        }, 500);

      }

    }

    // MODE: Career Path (Add-on)

    if (mode === 'career_path' || mode === 'career_intelligence') {

      const reportLabel = mode === 'career_intelligence' ? 'Career Intelligence' : 'Career Path';

      console.log(`🚀 Modo: ${reportLabel} Analysis [lang=${language}]`);

      const { valid, sanitized, error } = sanitizeCVText(cvText);

      if (!valid) {

        return jsonResponse({

          success: false,

          error

        }, 400);

      }

      const linkedinUrl = body.linkedin_url || '';

      const linkedinData = body.linkedin_data || '';

      try {

        // Gemini company enrichment for Career Path

        const cpCompanyContext = await enrichWithCompanyData(sanitized, language);

        const careerPathOutputLanguageInstruction = getLanguageOutputInstruction(language);
        const requestedLanguageLabel = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : 'Portuguese (Portugal)';

        const careerPathPrompt = isEN ? `You are an elite Career Advisor with 20 years of experience in career development, executive coaching and talent management at firms like McKinsey, Deloitte and Heidrick & Struggles. You analyse careers in depth, cross-referencing CV and LinkedIn data to produce highly personalised recommendations.

${careerPathOutputLanguageInstruction}
MANDATORY LANGUAGE RULE: Respond entirely in ${requestedLanguageLabel}. Never mix languages in the analytical output.



NULL RULE: For personal data fields (name, email, phone, current employer) — copy exactly from the CV or use null. For analytical fields (market assessments, salary ranges, typical companies, competitive advantages) — use your knowledge to produce rich, specific, personalised content. Prefer depth and specificity over brevity.

COMPANY RULE: In typical_companies and alternative_companies, only list companies you are CERTAIN exist and actively operate in ${marketCtx}. When in doubt, use well-known multinationals with confirmed offices there rather than inventing local names.

SALARY FORMAT: All salary_range values are annual gross in ${currency.code}, as plain integers. Example: 45000, not "45,000 EUR" and not "45k".

RICHNESS RULE: This is a premium paid report. Every section must be detailed, personalised and substantiated. Address the professional by their first name throughout. Generic or short answers are NOT acceptable.



ANALYSE THE FOLLOWING CV:

${sanitized}



${cpCompanyContext}

${linkedinData ? `LINKEDIN DATA:\n${linkedinData}\n` : ''}${linkedinUrl ? `LINKEDIN URL: ${linkedinUrl}\n` : ''}



${getLocalisationInstructions(country, region, currency, language)}

NARRATIVE DEPTH RULES (MANDATORY):

- Write as an elite career advisor in direct conversation with the professional — address them by first name throughout.

- Every analytical field must be a crafted narrative paragraph, not a form answer.

- Minimum word counts: seniority_justification = 80 words; market_value_assessment = 60 words; each competitive_advantage item = 20 words; why_this_role = 60 words; logic per strategic_path = 100 words; justification in decision_recommendation = 120 words; when_to_switch = 60 words; each tradeoff field = 40 words; five_year_narrative = 100 words; demand_level/competitiveness/differentiator = 60 words each.

- Weave the professional's actual employers, certifications and career milestones into every section.

- Vary sentence structure — avoid starting consecutive sentences with the same subject.



PRODUCE A COMPLETE "CAREER PATH" REPORT IN JSON WITH THE FOLLOWING STRUCTURE:



{

  "name": "EXACT full name as written in the CV — DO NOT invent or guess",

  "candidate_name": "EXACT full name as written in the CV — must match 'name' field above",

  "current_role": "Current or most recent job title as written in the CV",

  "career_path": {

    "current_positioning": {

      "seniority_level": "Junior/Mid-level/Senior/Lead/Director/VP/C-Level",

      "seniority_justification": "4-5 sentences minimum. Justify the seniority level by referencing: total years of experience, specific examples of project complexity and scope from the CV, team or budget size managed, organisational level of stakeholders engaged, and demonstrated business impact with concrete examples from their actual career history.",

      "primary_domain": "Main area of expertise (e.g., Human Capital, Digital Transformation, Finance)",

      "secondary_domains": ["4-6 complementary domains, each specific to what appears in the CV — not generic labels"],

      "market_value_assessment": "3-4 sentences. Assess the professional's market value in ${marketCtx} by name, referencing their specific combination of employers, credentials and skills. Compare to typical market positioning for this profile. Explain what makes this profile above or below average and why.",

      "competitive_advantages": ["5-7 competitive advantages — each must be a specific statement tied to the CV, not a generic tag. Example: 'Big 4 pedigree combined with pharma sector experience creates a rare cross-industry profile that most HR Directors lack'"],

      "blind_spots": ["3-4 blind spots — each must be a 2-sentence item: name the gap and explain the specific career risk it creates for this person"]

    },

    "cv_linkedin_cross_analysis": {

      "consistency_score": "High/Medium/Low",

      "gaps_identified": ["Specific skills or experiences visible on LinkedIn but absent from the CV — minimum 3 items"],

      "cv_strengths_not_on_linkedin": ["Specific CV elements that should be more visible on LinkedIn — minimum 3 items"],

      "optimization_suggestions": ["Concrete actionable suggestions to align both profiles — minimum 3 items"]

    },

    "next_roles": [

      {

        "role_title": "Suggested role title",

        "timeline": "Short-term (6-12 months) / Medium-term (1-3 years) / Long-term (3-5 years)",

        "fit_percentage": 85,

        "why_this_role": "3-4 sentences. Explain specifically why THIS role fits THIS person: reference their current employer, previous experience, key skills from the CV, and why the timing is right for this move now.",

        "what_you_already_have": ["minimum 6 specific items drawn directly from the CV — skills, certifications, experiences, employers, projects, tools. Each item must be specific, not generic."],

        "what_you_need": ["minimum 6 specific items — be granular. Name specific certifications, tools, frameworks, experience types or knowledge areas. Example: 'SHRM-SCP certification' not 'HR certification'"],

        "typical_companies": ["5-7 real specific companies operating in ${country || 'the international market'} — include sector labels. Example: 'AstraZeneca (pharma)', 'Deloitte Portugal (consulting)', 'Millennium BCP (banking)'"],

        "salary_range": "Annual gross in ${currency.symbol} (${currency.code}). Format: '${currency.symbol}75,000 – ${currency.symbol}110,000/year gross'. Plain integers also in salary_min and salary_max.",

        "salary_min": "<integer annual gross in ${currency.code}, e.g. 75000>",

        "salary_max": "<integer annual gross in ${currency.code}, e.g. 110000>",

        "salary_period": "annual"

      }

    ],

    "development_plan": {

      "formations": [

        {

          "name": "Specific training/course name",

          "provider": "Specific provider (e.g., INSEAD, Nova SBE Executive Education, Coursera)",

          "duration": "Estimated duration",

          "cost": "Estimated cost or Free",

          "relevance": "2-3 sentences explaining why THIS course addresses a specific gap for THIS person given their current career stage and goals",

          "priority": "High/Medium/Low",

          "url": "Link if available, otherwise null"

        }

      ],

      "certifications": [

        {

          "name": "Certification name",

          "body": "Certifying body",

          "investment": "Estimated cost and time",

          "impact": "2-3 sentences on the specific career impact this certification would have for this professional in ${marketCtx}",

          "priority": "High/Medium/Low"

        }

      ],

      "visibility_exercises": [

        {

          "activity": "Specific activity tied to this person's expertise (e.g., 'Write a monthly LinkedIn article series on AI in HR processes, drawing on your AstraZeneca experience')",

          "platform": "Specific platform and format",

          "frequency": "Recommended frequency",

          "expected_impact": "2-3 sentences on the specific positioning impact and audience this would reach",

          "concrete_first_step": "One specific actionable first step with a concrete detail (e.g., 'Reach out to the organiser of [Event Name] at [email/LinkedIn]')"

        }

      ],

      "networking_strategy": [

        {

          "action": "Specific networking action tailored to this person's profile",

          "target": "Specific type and seniority of contacts to seek, with rationale",

          "entities": [

            {

              "name": "Organization, community, event or conference name",

              "type": "community|event|association|conference",

              "description": "4 sentences minimum: (1) What this entity is and its relevance to the field. (2) Why it is specifically valuable for this professional given their background and goals. (3) What type of participation is possible — attend, speak, mentor, join board, sponsor. (4) A concrete first step to get involved, including who to contact or how to register.",

              "website": "Official website URL if known, otherwise null",

              "location": "City/Country or Online",

              "frequency": "How often it happens (annual, monthly, quarterly, ongoing)"

            }

          ]

        }

      ],

      "free_courses": [

        {

          "name": "Specific real free course name",

          "platform": "Platform name",

          "provider": "Course provider/university",

          "duration": "Short duration",

          "relevance": "2 sentences on why this specific free course addresses a specific gap for this person",

          "search_url": "Direct search URL on the platform"

        }

      ]

    },

    "immediate_actions": [

      {

        "priority": 1,

        "action": "Specific actionable step with enough detail to act on immediately — include names, platforms, or contacts where possible",

        "timeframe": "Specific timeframe (e.g., 'Next 7 days', 'This month')",

        "expected_outcome": "2 sentences: what this action unlocks and how it advances the recommended career path"

      }

    ],

    "long_term_vision": {

      "five_year_narrative": "5-7 sentences written in second person, addressing the professional by first name. Paint a specific, inspiring but realistic picture of where they can be in 5 years if they follow this plan: what role, what company type, what responsibilities, what recognition, and what personal satisfaction. Reference their actual career trajectory and strengths.",

      "key_milestones": [

        {

          "year": "Year 1",

          "milestone": "Specific milestone with context — not generic. Example: 'Complete SHRM-SCP and take on a regional HR lead role within AstraZeneca or equivalent pharma multinational'"

        }

      ]

    },

    "strategic_paths": [

      {

        "name": "Path name (e.g., Vertical Corporate Growth, Advisory & Consulting Pivot, Entrepreneurial / Portfolio Career)",

        "success_probability": 78,

        "logic": "5-6 sentences minimum. Explain why this path makes strategic sense for THIS person right now: reference their current employer, career stage, strongest skills, market timing, and personal trajectory. Make the case for why this path is coherent with who they are professionally.",

        "ideal_for": "2-3 sentences describing the professional mindset, risk appetite, and personal priorities that make someone well-suited to this path — then note how this person fits or diverges from that ideal",

        "associated_roles": ["4-6 specific role titles that represent this path, ordered from nearest to furthest"]

      }

    ],

    "strategic_comparison": [

      {

        "path_name": "Same name as in strategic_paths",

        "success_probability": 78,

        "estimated_time": "Time to see meaningful results",

        "effort_level": "Medium/High/Very High",

        "risk_level": "Low/Medium/High",

        "salary_impact": "Specific range or percentage with context (e.g., '+20-35% in 2 years if promotion achieved')",

        "profile_fit": "Integer percentage + 2-sentence justification referencing the specific CV"

      }

    ],

    "tradeoffs": [

      {

        "path_name": "Same name as in strategic_paths",

        "you_gain": "3 sentences minimum. Be specific and personal — what does THIS person gain given their current situation, relationships and ambitions",

        "you_give_up": "3 sentences minimum. Be honest and concrete — what does THIS person genuinely sacrifice or risk by choosing this path",

        "hidden_risk": "2-3 sentences on a non-obvious risk specific to this person's profile and market context — something a good advisor would flag that most people overlook",

        "real_scenario": "3-4 sentences painting a realistic picture of what the first 6 months on this path would look like for this person — the daily reality, not the marketing version"

      }

    ],

    "decision_recommendation": {

      "recommended_path": "Name of the recommended path (must match one of the strategic_paths names exactly)",

      "justification": "6-8 sentences minimum. Build a personalised case for this recommendation by referencing: the professional's name, their specific career history, current employer, strongest assets, the market opportunity, and why the timing is right now. Compare explicitly to the other paths and explain why this one wins for THIS person at THIS stage.",

      "when_to_switch": "3-4 sentences. Give concrete, specific triggers that should make this person reconsider — not generic advice like 'if you are unhappy'. Name specific circumstances, timelines, or events.",

      "why_better_than_others": "3-4 sentences comparing this path explicitly to the other two, referencing what specifically about this person's profile makes this the optimal choice over the alternatives"

    },

    "action_plan_by_path": [

      {

        "path_name": "Same name as in strategic_paths",

        "is_recommended": true,

        "actions": [

          {

            "timeframe": "Month 1",

            "action": "Specific action with enough detail to act on — name platforms, contacts, or organisations where relevant",

            "is_critical": true

          },

          {

            "timeframe": "Month 2-3",

            "action": "Specific follow-up action",

            "is_critical": false

          },

          {

            "timeframe": "Month 4-6",

            "action": "Specific medium-term action",

            "is_critical": false

          },

          {

            "timeframe": "Month 6-12",

            "action": "Specific longer horizon action",

            "is_critical": false

          }

        ]

      }

    ],

    "market_context": {

      "aligned_companies": {

        "Sector Name 1 (e.g., Pharma & Life Sciences)": ["Company A", "Company B", "Company C — 3-4 real companies per sector"],

        "Sector Name 2 (e.g., Management Consulting)": ["Company D", "Company E", "Company F"],

        "Sector Name 3 (e.g., Technology & Digital)": ["Company G", "Company H"],

        "Sector Name 4 (e.g., Banking & Financial Services)": ["Company I", "Company J", "Company K"],

        "Sector Name 5 (e.g., FMCG & Retail)": ["Company L", "Company M"]

      },

      "aligned_companies_note": "IMPORTANT: aligned_companies MUST be an OBJECT where keys are sector/industry names and values are arrays of 2-4 real company names per sector. Include 4-5 sectors with 3-4 companies each, all operating in ${country || 'the target market'}. Companies must be REAL and relevant to this person's profile.",

      "demand_level": "3-4 sentences. Assess current demand for this person's specific skill combination in ${marketCtx}: is it growing or declining, what is driving it, and what does that mean for their negotiating power and options in the next 12-24 months.",

      "competitiveness": "3-4 sentences. How saturated is this market for this profile type: who are the competing profiles, what makes them different, and where does this person stand relative to the competition.",

      "differentiator": "3-4 sentences. What specifically and concretely sets this person apart — reference specific employers, certifications, experiences or combinations that are rare in ${marketCtx} and valuable to hiring managers"

    }

  }

}



CRITICAL RULES:

- The "name" and "candidate_name" fields MUST contain the EXACT name found in the CV text. NEVER invent, guess or hallucinate a name. If no name is found, use "N/A".

- ALL text must be in English

- NEVER criticize overlapping dates between professional experiences — it is perfectly normal to hold multiple roles simultaneously (teachers, doctors, consultants, entrepreneurs, freelancers, parallel positions). This is NOT an inconsistency or a red flag.

- NEVER criticize future dates in experiences — they may represent confirmed roles starting soon.

- Minimum 5 suggested roles in next_roles (mix of short, medium and long term)

- Minimum 4 training courses and 3 certifications

- Minimum 3 free micro-courses in free_courses — these MUST be different from the paid formations. They should be real, specific, short free courses (MOOCs, micro-credentials) that actually exist on platforms like Coursera (audit), edX (audit), Google Digital Garage, LinkedIn Learning, Khan Academy, freeCodeCamp, etc. NEVER repeat the same titles as the paid formations.

- Minimum 4 visibility exercises

- Minimum 5 prioritised immediate actions

- MANDATORY: For each role in next_roles, "what_you_already_have" MUST have a minimum of 5 specific items drawn from the actual CV. "what_you_need" MUST also have a minimum of 5 specific items — be granular, not generic (e.g. "PMP certification" not "project management skills").

- MANDATORY: networking_strategy MUST have exactly 3 actions. Each action MUST have exactly 3 entities. Each entity description MUST be 3-4 sentences covering: what it is, why it is relevant to this specific professional, what type of participation is possible, and how to get involved.

- Be VERY specific and personalised — nothing generic

- ALL results MUST be localised to ${marketCtx}: companies, training, certifications, salary ranges, networking events — everything must reflect the reality of ${country}${region ? ` (${region})` : ''}

- Salary ranges MUST be in ${currency.symbol} (${currency.code}) and realistic for the local market

- If reliable data is not available for ${country}, state it explicitly rather than inventing figures

- If no LinkedIn data is available, omit the cv_linkedin_cross_analysis section and focus only on the CV

- MANDATORY: You MUST generate exactly 3 strategic_paths — each representing a distinct career direction

- MANDATORY: strategic_comparison MUST have exactly 3 items matching the 3 strategic_paths

- MANDATORY: tradeoffs MUST have exactly 3 items matching the 3 strategic_paths

- MANDATORY: action_plan_by_path MUST have exactly 3 items matching the 3 strategic_paths, each with 3-5 actions

- MANDATORY: In action_plan_by_path, set is_critical to true for AT MOST 1 action per path (the single most important first step). All other actions MUST have is_critical: false

- MANDATORY: decision_recommendation MUST recommend one of the 3 strategic_paths with full justification

- MANDATORY: market_context MUST reference real companies and real market conditions

- Return ONLY the JSON, no additional text` : isES ? `Eres un Career Advisor de élite con 20 años de experiencia en desarrollo de carrera, coaching ejecutivo y talent management en empresas como McKinsey, Deloitte y Heidrick & Struggles. Analizas carreras con profundidad, cruzando datos de CV y LinkedIn para producir recomendaciones altamente personalizadas.
${careerPathOutputLanguageInstruction}
REGLA NULL: Para datos personales (nombre, email, teléfono, empleador actual) — copia exactamente del CV o usa null. Para campos analíticos (análisis de mercado, rangos salariales, empresas típicas, ventajas competitivas) — usa tu conocimiento para producir contenido rico, específico y personalizado. Prefiere profundidad y especificidad en lugar de brevedad.
REGLA DE EMPRESAS: En typical_companies y alternative_companies, lista solo empresas que ESTÉS SEGURO que existen y operan activamente en ${marketCtx}. En caso de duda, usa multinacionales conocidas con oficinas confirmadas en el país en lugar de inventar nombres locales.
FORMATO SALARIAL: Todos los valores de salary_range son anuales brutos en ${currency.code}, como enteros simples. Ejemplo: 45000, no "45.000 EUR" ni "45k".
REGLA DE RIQUEZA: Este es un informe premium de pago. Cada sección debe ser detallada, personalizada y fundamentada. Trata al profesional por su nombre de pila a lo largo del informe. Respuestas genéricas o cortas NO son aceptables.
ANALIZA EL SIGUIENTE CV:
${sanitized}
${cpCompanyContext}
${linkedinData ? `LINKEDIN DATA:\n${linkedinData}\n` : ''}${linkedinUrl ? `LINKEDIN URL: ${linkedinUrl}\n` : ''}
${getLocalisationInstructions(country, region, currency, language)}
REGLAS DE PROFUNDIDAD NARRATIVA (OBLIGATORIAS):
- Escribe como un asesor de carrera de élite en conversación directa con el profesional — trátalo por su nombre de pila en todo momento.
- Cada campo analítico debe ser un párrafo narrativo elaborado, no una respuesta de formulario.
- Mínimos de palabras: seniority_justification = 80 palabras; market_value_assessment = 60 palabras; cada ítem de competitive_advantage = 20 palabras; why_this_role = 60 palabras; logic por strategic_path = 100 palabras; justification en decision_recommendation = 120 palabras; when_to_switch = 60 palabras; cada campo de tradeoff = 40 palabras; five_year_narrative = 100 palabras; demand_level/competitiveness/differentiator = 60 palabras cada uno.
- Integra los empleadores reales, certificaciones e hitos de carrera del profesional en cada sección.
- Varía la estructura de las frases — evita empezar frases consecutivas con el mismo sujeto.
PRODUCE UN INFORME "CAREER PATH" COMPLETO EN JSON CON LA SIGUIENTE ESTRUCTURA:
{ "name": "Nombre EXACTO completo tal como está escrito en el CV — NO inventar ni adivinar", "candidate_name": "Nombre EXACTO completo tal como está escrito en el CV — debe ser igual al campo 'name' arriba", "current_role": "Cargo actual o más reciente tal como está escrito en el CV", "career_path": { "current_positioning": { "seniority_level": "Junior/Mid-level/Senior/Lead/Director/VP/C-Level", "seniority_justification": "Mínimo 4-5 frases. Justifica el nivel de seniority referenciando: total de años de experiencia, ejemplos concretos de complejidad y alcance de los proyectos del CV, tamaño de equipos o presupuestos gestionados, nivel organizacional de los stakeholders involucrados, e impacto de negocio demostrado con ejemplos concretos de su trayectoria real.", "primary_domain": "Área principal de actuación (ej: Human Capital, Digital Transformation, Finance)", "secondary_domains": ["4-6 dominios complementarios específicos a lo que aparece en el CV — no etiquetas genéricas"], "market_value_assessment": "3-4 frases. Evalúa el valor de mercado del profesional en ${marketCtx}, tratándolo por su nombre, referenciando la combinación específica de empleadores, credenciales y competencias. Compara con el posicionamiento típico de mercado para este perfil. Explica qué hace que este perfil esté por encima o por debajo de la media y por qué.", "competitive_advantages": ["5-7 ventajas competitivas — cada una debe ser una afirmación específica ligada al CV, no una etiqueta genérica."], "blind_spots": ["3-4 puntos ciegos — cada uno debe ser un ítem de 2 frases: nombra la laguna y explica el riesgo específico que crea para la carrera de esta persona"] }, "cv_linkedin_cross_analysis": { "consistency_score": "Alta/Media/Baja", "gaps_identified": ["Competencias o experiencias visibles en LinkedIn pero ausentes del CV — mínimo 3 ítems"], "cv_strengths_not_on_linkedin": ["Elementos específicos del CV que deberían ser más visibles en LinkedIn — mínimo 3 ítems"], "optimization_suggestions": ["Sugerencias concretas y accionables para alinear ambos perfiles — mínimo 3 ítems"] }, "next_roles": [ { "role_title": "Título del cargo sugerido", "timeline": "Corto plazo (6-12 meses) / Medio plazo (1-3 años) / Largo plazo (3-5 años)", "fit_percentage": 85, "why_this_role": "3-4 frases. Explica específicamente por qué ESTE cargo encaja en ESTA persona.", "what_you_already_have": ["mínimo 6 ítems específicos extraídos directamente del CV"], "what_you_need": ["mínimo 6 ítems específicos — sé granular"], "typical_companies": ["5-7 empresas reales operando en ${country || 'España'}${region ? ` (${region})` : ''}"], "salary_range": "Bruto anual en ${currency.symbol} (${currency.code}). Formato: '${currency.symbol}75.000 – ${currency.symbol}110.000/año bruto'.", "salary_min": 75000, "salary_max": 110000, "salary_period": "annual" } ], "development_plan": { "formations": [ { "name": "Nombre específico del curso/programa", "provider": "Institución real (priorizar instituciones en ${marketCtx} o globales reconocidas)", "duration": "Duración estimada", "cost": "Coste estimado o Gratuito", "relevance": "2-3 frases explicando por qué ESTE curso aborda una laguna específica para ESTA persona", "priority": "Alta/Media/Baja", "url": "Enlace si disponible, sino null" } ], "certifications": [ { "name": "Nombre exacto de la certificación", "body": "Entidad emisora", "investment": "Coste y tiempo estimados", "impact": "2-3 frases sobre el impacto específico en la carrera de este profesional en ${marketCtx}", "priority": "Alta/Media/Baja" } ], "visibility_exercises": [ { "activity": "Actividad específica vinculada a la experiencia de esta persona", "platform": "Plataforma y formato específicos", "frequency": "Frecuencia recomendada", "expected_impact": "2-3 frases sobre el impacto de posicionamiento", "concrete_first_step": "Un primer paso accionable con detalle concreto" } ], "networking_strategy": [ { "action": "Acción de networking específica adaptada al perfil de esta persona", "target": "Tipo y seniority específicos de contactos a buscar, con justificación", "entities": [ { "name": "Nombre de la organización, comunidad, evento o conferencia", "type": "community|event|association|conference", "description": "4 frases mínimo: (1) Qué es esta entidad y su relevancia. (2) Por qué es valiosa para este profesional. (3) Qué tipo de participación es posible. (4) Un primer paso concreto para involucrarse.", "website": "URL oficial si conocida, sino null", "location": "Ciudad/País u Online", "frequency": "Frecuencia (anual, mensual, trimestral, continuo)" } ] } ], "free_courses": [ { "name": "Nombre real de curso gratuito específico", "platform": "Nombre de la plataforma", "provider": "Proveedor del curso/universidad", "duration": "Duración corta", "relevance": "2 frases sobre por qué este curso gratuito aborda una laguna específica", "search_url": "URL de búsqueda directa en la plataforma" } ] }, "immediate_actions": [ { "priority": 1, "action": "Paso accionable específico con suficiente detalle para actuar inmediatamente", "timeframe": "Plazo específico (ej: 'Próximos 7 días', 'Este mes')", "expected_outcome": "2 frases: qué desbloquea esta acción y cómo avanza el camino de carrera recomendado" } ], "long_term_vision": { "five_year_narrative": "5-7 frases en segunda persona, dirigiéndose al profesional por su nombre. Pinta un cuadro específico, inspirador pero realista de dónde puede estar en 5 años si sigue este plan.", "key_milestones": [ { "year": "Año 1", "milestone": "Hito específico con contexto — no genérico" } ] }, "strategic_paths": [ { "name": "Nombre del camino estratégico (ej: Crecimiento Corporativo Vertical, Pivot a Consultoría, Carrera Emprendedora / Portfolio)", "success_probability": 78, "logic": "Mínimo 100 palabras. Explica por qué este camino tiene sentido estratégico para ESTA persona ahora.", "ideal_for": "2-3 frases describiendo la mentalidad profesional ideal para este camino", "associated_roles": ["4-6 títulos de cargo específicos ordenados del más cercano al más lejano"] } ], "strategic_comparison": [ { "path_name": "Debe coincidir con name arriba", "success_probability": 78, "estimated_time": "Tiempo para ver resultados significativos", "effort_level": "Medio/Alto/Muy Alto", "risk_level": "Bajo/Medio/Alto", "salary_impact": "Rango o porcentaje específico con contexto", "profile_fit": "Porcentaje entero + justificación de 2 frases" } ], "tradeoffs": [ { "path_name": "Debe coincidir con name arriba", "you_gain": "Mínimo 3 frases. Ser específico y personal.", "you_give_up": "Mínimo 3 frases. Ser honesto y concreto.", "hidden_risk": "2-3 frases sobre un riesgo no obvio específico al perfil de esta persona", "real_scenario": "3-4 frases pintando un cuadro realista de los primeros 6 meses" } ], "action_plan_by_path": [ { "path_name": "Debe coincidir con name arriba", "is_recommended": true, "actions": [ { "timeframe": "Mes 1", "action": "Acción específica con suficiente detalle para actuar", "is_critical": true }, { "timeframe": "Mes 2-3", "action": "Acción de seguimiento específica", "is_critical": false }, { "timeframe": "Mes 4-6", "action": "Acción a medio plazo específica", "is_critical": false }, { "timeframe": "Mes 6-12", "action": "Acción a horizonte más largo", "is_critical": false } ] } ], "decision_recommendation": { "recommended_path": "Nombre del camino recomendado (debe coincidir exactamente con uno de los strategic_paths)", "justification": "Mínimo 120 palabras. Justificación detallada cruzando las fortalezas del CV con la realidad del mercado en ${marketCtx}.", "when_to_switch": "Mínimo 60 palabras. Indicadores claros de cuándo pivotar a un camino alternativo.", "why_better_than_others": "3-4 frases comparando explícitamente este camino con los otros dos" }, "market_context": { "aligned_companies": { "Nombre del Sector 1 (ej: Farmacéutica)": ["Empresa A", "Empresa B", "Empresa C"], "Nombre del Sector 2 (ej: Consultoría)": ["Empresa D", "Empresa E", "Empresa F"], "Nombre del Sector 3 (ej: Tecnología)": ["Empresa G", "Empresa H"], "Nombre del Sector 4 (ej: Banca)": ["Empresa I", "Empresa J", "Empresa K"], "Nombre del Sector 5 (ej: FMCG & Retail)": ["Empresa L", "Empresa M"] }, "aligned_companies_note": "IMPORTANTE: aligned_companies DEBE ser un OBJETO donde las claves son nombres de sector/industria y los valores son arrays de 2-4 empresas reales por sector. Incluir 4-5 sectores con 3-4 empresas cada uno, todas operando en ${country || 'España'}.", "demand_level": "3-4 frases. Evalúa la demanda actual para esta combinación de competencias en ${marketCtx}.", "competitiveness": "3-4 frases. Cuán saturado está este mercado para este tipo de perfil.", "differentiator": "3-4 frases. Qué distingue específicamente a esta persona — referencia empleadores, certificaciones o experiencias concretas" } } }
REGLAS FINALES:
- OBLIGATORIO: Mínimo 5 cargos sugeridos en next_roles (mezcla de corto, medio y largo plazo)
- OBLIGATORIO: Mínimo 4 formaciones y 3 certificaciones en development_plan
- OBLIGATORIO: Mínimo 3 cursos gratuitos en development_plan.free_courses — DEBEN ser diferentes de las formaciones de pago
- OBLIGATORIO: Mínimo 4 ejercicios de visibilidad en development_plan.visibility_exercises
- OBLIGATORIO: Mínimo 5 acciones inmediatas priorizadas en immediate_actions
- OBLIGATORIO: Para cada cargo en next_roles, "what_you_already_have" DEBE tener mínimo 5 ítems del CV. "what_you_need" DEBE tener mínimo 5 ítems específicos.
- OBLIGATORIO: networking_strategy DEBE tener exactamente 3 acciones. Cada acción DEBE tener exactamente 3 entidades. La descripción de cada entidad DEBE tener 3-4 frases.
- Sé MUY específico y personalizado — nada genérico
- TODOS los resultados DEBEN estar localizados para ${marketCtx}: empresas, formaciones, certificaciones, rangos salariales, eventos de networking
- Los rangos salariales DEBEN estar en ${currency.symbol} (${currency.code}) y ser realistas para el mercado local
- Si no existen datos fiables para ${country || 'España'}, dilo explícitamente en lugar de inventar valores
- Si no hay datos de LinkedIn, omite la sección cv_linkedin_cross_analysis y céntrate solo en el CV
- OBLIGATORIO: DEBES generar exactamente 3 strategic_paths — cada uno representando una dirección de carrera distinta
- OBLIGATORIO: strategic_comparison DEBE tener exactamente 3 ítems correspondientes a los 3 strategic_paths
- OBLIGATORIO: tradeoffs DEBE tener exactamente 3 ítems correspondientes a los 3 strategic_paths
- OBLIGATORIO: action_plan_by_path DEBE tener exactamente 3 ítems correspondientes a los 3 strategic_paths, cada uno con 3-5 acciones
- OBLIGATORIO: En action_plan_by_path, define is_critical como true para COMO MÁXIMO 1 acción por camino
- OBLIGATORIO: decision_recommendation DEBE recomendar uno de los 3 strategic_paths con justificación completa
- OBLIGATORIO: market_context DEBE referenciar empresas reales y condiciones reales de mercado
- Devuelve SOLO el JSON, sin texto adicional` : `És um Career Advisor de elite com 20 anos de experiência em desenvolvimento de carreira, coaching executivo e talent management em empresas como McKinsey, Deloitte e Heidrick & Struggles. Analisas carreiras com profundidade, cruzando dados de CV e LinkedIn para produzir recomendações altamente personalizadas.



REGRA NULL: Para dados pessoais (nome, email, telefone, empregador actual) — copia exactamente do CV ou usa null. Para campos analíticos (análises de mercado, faixas salariais, empresas típicas, vantagens competitivas) — usa o teu conhecimento para produzir conteúdo rico, específico e personalizado. Prefere profundidade e especificidade em vez de brevidade.

REGRA DE EMPRESAS: Em typical_companies e alternative_companies, lista apenas empresas que TENS A CERTEZA que existem e operam activamente em ${marketCtx}. Em caso de dúvida, usa multinacionais conhecidas com escritórios confirmados no país em vez de inventar nomes locais.

FORMATO SALARIAL: Todos os valores de salary_range são anuais brutos em ${currency.code}, como inteiros simples. Exemplo: 45000, não "45.000 EUR" nem "45k".

REGRA DE RIQUEZA: Este é um relatório premium pago. Cada secção deve ser detalhada, personalizada e fundamentada. Trata o profissional pelo primeiro nome ao longo do relatório. Respostas genéricas ou curtas NÃO são aceitáveis.



ANALISA O SEGUINTE CV:

${sanitized}



${cpCompanyContext}

${linkedinData ? `DADOS DO LINKEDIN:\n${linkedinData}\n` : ''}${linkedinUrl ? `URL DO LINKEDIN: ${linkedinUrl}\n` : ''}

${getLocalisationInstructions(country, region, currency, 'pt')}

REGRAS DE PROFUNDIDADE NARRATIVA (OBRIGATÓRIO):

- Escreve como um career advisor de elite em conversa directa com o profissional — trata-o pelo primeiro nome ao longo de todo o relatório.

- Cada campo analítico deve ser um parágrafo narrativo elaborado, não uma resposta de formulário.

- Mínimos de palavras: seniority_justification = 80 palavras; market_value_assessment = 60 palavras; cada item de competitive_advantage = 20 palavras; why_this_role = 60 palavras; logic por strategic_path = 100 palavras; justification na decision_recommendation = 120 palavras; when_to_switch = 60 palavras; cada campo de tradeoff = 40 palavras; five_year_narrative = 100 palavras; demand_level/competitiveness/differentiator = 60 palavras cada.

- Integra os empregadores reais, certificações e marcos de carreira do profissional em cada secção.

- Varia a estrutura frásica — evita começar frases consecutivas com o mesmo sujeito.



PRODUZ UM RELATÓRIO "CAREER PATH" COMPLETO EM JSON COM A SEGUINTE ESTRUTURA:



{

  "name": "Nome EXACTO completo tal como escrito no CV — NÃO inventar nem adivinhar",

  "candidate_name": "Nome EXACTO completo tal como escrito no CV — deve ser igual ao campo 'name' acima",

  "current_role": "Cargo actual ou mais recente tal como escrito no CV",

  "career_path": {

    "current_positioning": {

      "seniority_level": "Júnior/Pleno/Sénior/Lead/Director/VP/C-Level",

      "seniority_justification": "Mínimo 4-5 frases. Justifica o nível de senioridade referenciando: total de anos de experiência, exemplos concretos de complexidade e alcance dos projectos do CV, dimensão de equipas ou orçamentos geridos, nível organizacional dos stakeholders envolvidos, e impacto de negócio demonstrado com exemplos concretos do percurso real.",

      "primary_domain": "Área principal de actuação (ex: Human Capital, Digital Transformation, Finance)",

      "secondary_domains": ["4-6 domínios complementares específicos ao que aparece no CV — não rótulos genéricos"],

      "market_value_assessment": "3-4 frases. Avalia o valor de mercado do profissional em ${getMarketContext(country, region)}, tratando-o pelo nome, referenciando a combinação específica de empregadores, credenciais e competências. Compara com o posicionamento típico de mercado para este perfil. Explica o que torna este perfil acima ou abaixo da média e porquê.",

      "competitive_advantages": ["5-7 vantagens competitivas — cada uma deve ser uma afirmação específica ligada ao CV, não um rótulo genérico. Exemplo: 'Pedigree Big 4 combinado com experiência no sector farmacêutico cria um perfil cross-industry raro que a maioria dos Directores de RH não possui'"],

      "blind_spots": ["3-4 pontos cegos — cada um deve ser um item de 2 frases: nomeia a lacuna e explica o risco específico que cria para a carreira desta pessoa"]

    },

    "cv_linkedin_cross_analysis": {

      "consistency_score": "Alta/Média/Baixa",

      "gaps_identified": ["Competências ou experiências visíveis no LinkedIn mas ausentes do CV — mínimo 3 itens específicos"],

      "cv_strengths_not_on_linkedin": ["Elementos específicos do CV que deviam estar mais visíveis no LinkedIn — mínimo 3 itens"],

      "optimization_suggestions": ["Sugestões concretas e accionáveis para alinhar ambos os perfis — mínimo 3 itens"]

    },

    "next_roles": [

      {

        "role_title": "Título do cargo sugerido",

        "timeline": "Curto prazo (6-12 meses) / Médio prazo (1-3 anos) / Longo prazo (3-5 anos)",

        "fit_percentage": 85,

        "why_this_role": "3-4 frases. Explica especificamente porque ESTE cargo encaixa NESTA pessoa: referencia o empregador actual, experiência anterior, competências-chave do CV, e porque o momento é adequado para esta mudança agora.",

        "what_you_already_have": ["mínimo 6 itens específicos retirados directamente do CV — competências, certificações, experiências, empregadores, projectos, ferramentas. Cada item deve ser específico, não genérico."],

        "what_you_need": ["mínimo 6 itens específicos — ser granular. Nomeia certificações, ferramentas, frameworks, tipos de experiência ou áreas de conhecimento específicas. Exemplo: 'Certificação SHRM-SCP' não 'certificação de RH'"],

        "typical_companies": ["5-7 empresas reais e específicas a operar em ${country || 'Portugal'}${region ? ` (${region})` : ''} — incluir rótulo de sector. Exemplo: 'AstraZeneca (farmacêutica)', 'Deloitte Portugal (consultoria)', 'Millennium BCP (banca)'"],

        "salary_range": "Bruto anual em ${currency.symbol} (${currency.code}). Formato: '${currency.symbol}75.000 – ${currency.symbol}110.000/ano bruto'. Inteiros simples também em salary_min e salary_max.",

        "salary_min": "<inteiro bruto anual em ${currency.code}, ex: 75000>",

        "salary_max": "<inteiro bruto anual em ${currency.code}, ex: 110000>",

        "salary_period": "anual"

      }

    ],

    "development_plan": {

      "formations": [

        {

          "name": "Nome específico da formação/curso",

          "provider": "Entidade específica (ex: INSEAD, Nova SBE Executive Education, Coursera)",

          "duration": "Duração estimada",

          "cost": "Custo estimado ou Gratuito",

          "relevance": "2-3 frases a explicar porque ESTA formação aborda uma lacuna específica para ESTA pessoa dado o seu estágio de carreira e objectivos actuais",

          "priority": "Alta/Média/Baixa",

          "url": "Link se disponível, caso contrário null"

        }

      ],

      "certifications": [

        {

          "name": "Nome da certificação",

          "body": "Entidade certificadora",

          "investment": "Custo e tempo estimados",

          "impact": "2-3 frases sobre o impacto específico na carreira que esta certificação teria para este profissional em ${getMarketContext(country, region)}",

          "priority": "Alta/Média/Baixa"

        }

      ],

      "visibility_exercises": [

        {

          "activity": "Actividade específica ligada à área de especialização desta pessoa (ex: 'Escrever uma série mensal de artigos no LinkedIn sobre IA em processos de RH, com base na experiência na AstraZeneca')",

          "platform": "Plataforma e formato específicos",

          "frequency": "Frequência recomendada",

          "expected_impact": "2-3 frases sobre o impacto de posicionamento específico e a audiência que atingiria",

          "concrete_first_step": "Um primeiro passo específico e accionável com um detalhe concreto (ex: 'Contactar o organizador de [Nome do Evento] em [email/LinkedIn]')"

        }

      ],

      "networking_strategy": [

        {

          "action": "Acção de networking específica adaptada ao perfil desta pessoa",

          "target": "Tipo e senioridade específicos dos contactos a procurar, com justificação",

          "entities": [

            {

              "name": "Nome da organização, comunidade, evento ou conferência",

              "type": "community|event|association|conference",

              "description": "Mínimo 4 frases: (1) O que é esta entidade e a sua relevância para a área. (2) Porque é especificamente valiosa para este profissional dado o seu background e objectivos. (3) Que tipo de participação é possível — assistir, falar, mentorizar, integrar órgão, patrocinar. (4) Um primeiro passo concreto para se envolver, incluindo a quem contactar ou como registar.",

              "website": "URL do website oficial se conhecido, caso contrário null",

              "location": "Cidade/País ou Online",

              "frequency": "Com que frequência acontece (anual, mensal, trimestral, contínuo)"

            }

          ]

        }

      ],

      "free_courses": [

        {

          "name": "Nome específico do curso gratuito real",

          "platform": "Nome da plataforma",

          "provider": "Fornecedor/universidade do curso",

          "duration": "Duração curta",

          "relevance": "2 frases sobre porque este curso gratuito específico aborda uma lacuna específica desta pessoa",

          "search_url": "URL de pesquisa directa na plataforma"

        }

      ]

    },

    "immediate_actions": [

      {

        "priority": 1,

        "action": "Passo accionável específico com detalhe suficiente para agir imediatamente — incluir nomes, plataformas ou contactos onde possível",

        "timeframe": "Prazo específico (ex: 'Próximos 7 dias', 'Este mês')",

        "expected_outcome": "2 frases: o que esta acção desbloqueia e como avança o caminho de carreira recomendado"

      }

    ],

    "long_term_vision": {

      "five_year_narrative": "5-7 frases escritas na segunda pessoa, tratando o profissional pelo primeiro nome. Pinta um quadro específico, inspirador mas realista de onde pode estar em 5 anos se seguir este plano: que cargo, que tipo de empresa, que responsabilidades, que reconhecimento, e que satisfação pessoal. Referencia a trajectória real de carreira e os pontos fortes.",

      "key_milestones": [

        {

          "year": "Ano 1",

          "milestone": "Marco específico com contexto — não genérico. Exemplo: 'Concluir certificação SHRM-SCP e assumir papel de HR Lead regional na AstraZeneca ou multinacional farmacêutica equivalente'"

        }

      ]

    },

    "strategic_paths": [

      {

        "name": "Nome do caminho (ex: Crescimento Corporativo em Multinacional, Pivot para Advisory & Consultoria, Caminho Empreendedor / Portfolio)",

        "success_probability": 78,

        "logic": "Mínimo 5-6 frases. Explica porque este caminho faz sentido estratégico para ESTA pessoa agora: referencia o empregador actual, estágio de carreira, competências mais fortes, timing de mercado, e trajectória pessoal. Constrói o argumento de porque este caminho é coerente com quem são profissionalmente.",

        "ideal_for": "2-3 frases descrevendo a mentalidade profissional, apetite ao risco e prioridades pessoais que tornam alguém adequado para este caminho — depois nota como esta pessoa se encaixa ou diverge desse ideal",

        "associated_roles": ["4-6 títulos de cargo específicos que representam este caminho, ordenados do mais próximo ao mais distante"]

      }

    ],

    "strategic_comparison": [

      {

        "path_name": "Mesmo nome do strategic_paths",

        "success_probability": 78,

        "estimated_time": "Tempo para ver resultados significativos",

        "effort_level": "Médio/Alto/Muito Alto",

        "risk_level": "Baixo/Médio/Alto",

        "salary_impact": "Intervalo ou percentagem específica com contexto (ex: '+20-35% em 2 anos se promoção alcançada')",

        "profile_fit": "Percentagem inteira + justificação de 2 frases referenciando o CV específico"

      }

    ],

    "tradeoffs": [

      {

        "path_name": "Mesmo nome do strategic_paths",

        "you_gain": "Mínimo 3 frases. Ser específico e pessoal — o que ESTA pessoa ganha dada a sua situação actual, relações e ambições",

        "you_give_up": "Mínimo 3 frases. Ser honesto e concreto — o que ESTA pessoa genuinamente sacrifica ou arrisca ao escolher este caminho",

        "hidden_risk": "2-3 frases sobre um risco não óbvio específico ao perfil e contexto de mercado desta pessoa — algo que um bom advisor sinalizaria e que a maioria das pessoas ignora",

        "real_scenario": "3-4 frases a pintar um quadro realista de como seriam os primeiros 6 meses neste caminho para esta pessoa — a realidade diária, não a versão de marketing"

      }

    ],

    "decision_recommendation": {

      "recommended_path": "Nome do caminho recomendado (deve corresponder exactamente a um dos nomes em strategic_paths)",

      "justification": "Mínimo 6-8 frases. Constrói um argumento personalizado para esta recomendação referenciando: o nome do profissional, o percurso específico de carreira, empregador actual, activos mais fortes, a oportunidade de mercado, e porque o timing é certo agora. Compara explicitamente com os outros caminhos e explica porque este vence para ESTA pessoa neste ESTÁGIO.",

      "when_to_switch": "3-4 frases. Dá gatilhos concretos e específicos que devem levar esta pessoa a reconsiderar — não conselhos genéricos como 'se estiveres infeliz'. Nomeia circunstâncias específicas, prazos ou eventos.",

      "why_better_than_others": "3-4 frases a comparar este caminho explicitamente com os outros dois, referenciando o que especificamente no perfil desta pessoa torna esta a escolha óptima em vez das alternativas"

    },

    "action_plan_by_path": [

      {

        "path_name": "Mesmo nome do strategic_paths",

        "is_recommended": true,

        "actions": [

          {

            "timeframe": "Mês 1",

            "action": "Acção específica com detalhe suficiente para agir — nomeia plataformas, contactos ou organizações onde relevante",

            "is_critical": true

          },

          {

            "timeframe": "Mês 2-3",

            "action": "Acção de seguimento específica",

            "is_critical": false

          },

          {

            "timeframe": "Mês 4-6",

            "action": "Acção a médio prazo específica",

            "is_critical": false

          },

          {

            "timeframe": "Mês 6-12",

            "action": "Acção a horizonte mais alargado",

            "is_critical": false

          }

        ]

      }

    ],

    "market_context": {

      "aligned_companies": {

        "Nome do Sector 1 (ex: Farmacêutica & Ciências da Vida)": ["Empresa A", "Empresa B", "Empresa C — 3-4 empresas reais por sector"],

        "Nome do Sector 2 (ex: Consultoria de Gestão)": ["Empresa D", "Empresa E", "Empresa F"],

        "Nome do Sector 3 (ex: Tecnologia & Digital)": ["Empresa G", "Empresa H"],

        "Nome do Sector 4 (ex: Banca & Serviços Financeiros)": ["Empresa I", "Empresa J", "Empresa K"],

        "Nome do Sector 5 (ex: FMCG & Retalho)": ["Empresa L", "Empresa M"]

      },

      "aligned_companies_note": "IMPORTANTE: aligned_companies DEVE ser um OBJECTO onde as chaves são nomes de sectores/indústrias e os valores são arrays de 3-4 nomes de empresas reais por sector. Incluir 4-5 sectores com 3-4 empresas cada, todas a operar em ${country || 'Portugal'}. As empresas devem ser REAIS e relevantes para o perfil desta pessoa.",

      "demand_level": "3-4 frases. Avalia a procura actual pela combinação específica de competências desta pessoa em ${getMarketContext(country, region)}: está a crescer ou a diminuir, o que a está a impulsionar, e o que isso significa para o poder negocial e as opções nos próximos 12-24 meses.",

      "competitiveness": "3-4 frases. Quão saturado está este mercado para este tipo de perfil: quem são os perfis concorrentes, o que os diferencia, e onde se posiciona esta pessoa face à concorrência.",

      "differentiator": "3-4 frases. O que especificamente e concretamente distingue esta pessoa — referencia empregadores, certificações, experiências ou combinações específicas que são raras em ${getMarketContext(country, region)} e valiosas para os decisores de contratação"

    }

  }

}



REGRAS CRÍTICAS:

- Os campos "name" e "candidate_name" DEVEM conter o nome EXACTO encontrado no texto do CV. NUNCA inventar, adivinhar ou alucinar um nome. Se não encontrares nome, usa "N/A".

- Tudo em Português de Portugal (PT-PT), NUNCA usar gerúndios

- NUNCA critiques sobreposição de datas entre experiências profissionais — é perfeitamente normal ter múltiplos cargos em simultâneo (professores, médicos, consultores, empreendedores, freelancers, cargos paralelos). Isto NÃO é uma inconsistência nem um red flag.

- NUNCA critiques datas futuras em experiências — podem representar cargos já confirmados que começam em breve.

- Mínimo 5 cargos sugeridos em next_roles (mix de curto, médio e longo prazo)

- Mínimo 4 formações e 3 certificações

- Mínimo 3 micro-cursos gratuitos em free_courses — DEVEM ser diferentes das formações pagas. Devem ser cursos gratuitos reais, específicos e curtos (MOOCs, micro-credenciais) que existam de facto em plataformas como Coursera (auditoria), edX (auditoria), Google Digital Garage, LinkedIn Learning, Khan Academy, freeCodeCamp, etc. NUNCA repetir os mesmos títulos das formações pagas.

- Mínimo 4 exercícios de visibilidade

- Mínimo 5 acções imediatas priorizadas

- OBRIGATÓRIO: Para cada cargo em next_roles, "what_you_already_have" DEVE ter no mínimo 5 itens específicos retirados do CV real. "what_you_need" DEVE também ter no mínimo 5 itens específicos — ser granular, não genérico (ex: "certificação PMP" em vez de "competências de gestão de projectos").

- OBRIGATÓRIO: networking_strategy DEVE ter exactamente 3 acções. Cada acção DEVE ter exactamente 3 entidades. A descrição de cada entidade DEVE ter 3-4 frases cobrindo: o que é, porque é relevante para este profissional específico, que tipo de participação é possível, e como envolver-se.

- Ser MUITO específico e personalizado — nada genérico

- TODOS os resultados DEVEM ser localizados para ${getMarketContext(country, region)}: empresas, formações, certificações, faixas salariais, eventos de networking — tudo deve reflectir a realidade de ${country || 'Portugal'}${region ? ` (${region})` : ''}

- Faixas salariais DEVEM ser em ${currency.symbol} (${currency.code}) e realistas para o mercado local

- Se não existirem dados fiáveis para ${country || 'Portugal'}, dizer explicitamente em vez de inventar valores

- Se não houver dados do LinkedIn, omitir a secção cv_linkedin_cross_analysis e focar apenas no CV

- OBRIGATÓRIO: DEVES gerar exactamente 3 strategic_paths — cada um a representar uma direcção de carreira distinta

- OBRIGATÓRIO: strategic_comparison DEVE ter exactamente 3 itens correspondentes aos 3 strategic_paths

- OBRIGATÓRIO: tradeoffs DEVE ter exactamente 3 itens correspondentes aos 3 strategic_paths

- OBRIGATÓRIO: action_plan_by_path DEVE ter exactamente 3 itens correspondentes aos 3 strategic_paths, cada um com 3-5 acções

- OBRIGATÓRIO: Em action_plan_by_path, definir is_critical como true para NO MÁXIMO 1 acção por caminho (o passo inicial mais importante). Todas as outras acções DEVEM ter is_critical: false

- OBRIGATÓRIO: decision_recommendation DEVE recomendar um dos 3 strategic_paths com justificação completa

- OBRIGATÓRIO: market_context DEVE referenciar empresas reais e condições reais de mercado

- Retorna APENAS o JSON, sem texto adicional`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: isEN ? 'You are an elite Career Advisor. I will send you a CV for Career Path analysis.' : isES ? 'Eres un Career Advisor de élite. Voy a enviarte un CV para un análisis de Career Path.' : 'És um Career Advisor de elite. Vou enviar-te um CV para análise Career Path.'

                  }

                ]

              },

              {

                role: 'model',

                parts: [

                  {

                    text: isEN ? 'Understood. I am ready to analyse the CV and produce a complete, detailed and highly personalised Career Path report in JSON. I will address the professional by their first name, provide substantiated recommendations with concrete data, and ensure every section is rich and specific — not generic.' : isES ? 'Entendido. Estoy listo para analizar el CV y producir un informe completo, detallado y altamente personalizado de Career Path en JSON. Me dirigiré al profesional por su nombre de pila, aportaré recomendaciones fundamentadas con datos concretos y me aseguraré de que cada sección sea rica y específica, nunca genérica.' : 'Compreendido. Estou pronto para analisar o CV e produzir um relatório Career Path completo, detalhado e altamente personalizado em JSON. Vou tratar o profissional pelo primeiro nome, fornecer recomendações fundamentadas com dados concretos, e garantir que cada secção é rica e específica — nunca genérica.'

                  }

                ]

              },

              {

                role: 'user',

                parts: [

                  {

                    text: careerPathPrompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 0.4,

              topK: 40,

              topP: 0.95,

              maxOutputTokens: 65536

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          console.error('❌ Erro Gemini Career Path:', errorText);

          return jsonResponse({

            success: false,

            error: mode === 'career_intelligence' ? 'Erro ao gerar Career Intelligence' : 'Erro ao gerar Career Path',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        // Check for truncation

        const cpFinishReason = geminiData.candidates?.[0]?.finishReason;

        if (cpFinishReason === 'MAX_TOKENS') {

          console.warn('⚠️ Career Path response truncated by MAX_TOKENS — attempting JSON repair');

        }

        let analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').trim();

        // Repair truncated JSON: count braces and close any unclosed ones

        let braceCount = 0;

        let bracketCount = 0;

        let inString = false;

        let escapeNext = false;

        for (const ch of analysisText){

          if (escapeNext) {

            escapeNext = false;

            continue;

          }

          if (ch === '\\') {

            escapeNext = true;

            continue;

          }

          if (ch === '"') {

            inString = !inString;

            continue;

          }

          if (inString) continue;

          if (ch === '{') braceCount++;

          if (ch === '}') braceCount--;

          if (ch === '[') bracketCount++;

          if (ch === ']') bracketCount--;

        }

        // If JSON is truncated, try to close it

        if (braceCount > 0 || bracketCount > 0) {

          console.warn(`⚠️ Repairing truncated JSON: ${braceCount} unclosed braces, ${bracketCount} unclosed brackets`);

          // Remove any trailing incomplete key-value pair

          analysisText = analysisText.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}\[\]]*$/, '');

          // Close brackets and braces

          for(let i = 0; i < bracketCount; i++)analysisText += ']';

          for(let i = 0; i < braceCount; i++)analysisText += '}';

        } else {

          // Normal case: just trim trailing non-JSON

          analysisText = analysisText.replace(/[^}]*$/, '');

        }

        analysisText = analysisText.trim();

        let careerPath = JSON.parse(analysisText);

        // ─── SECOND PASS: if development_plan or long_term_vision is missing, generate them ───
        const cpInner = careerPath.career_path || careerPath;
        const needsSecondPass = !cpInner.development_plan || !cpInner.long_term_vision;

        if (needsSecondPass) {
          console.warn('⚠️ Career Path missing development_plan or long_term_vision — running second pass');
          try {
            const existingRoles = (cpInner.next_roles || []).slice(0, 2).map((r: any) => r.role_title).join(', ');
            const secondPassPrompt = isEN
              ? `You are an elite Career Advisor. Based on this CV, generate ONLY the missing sections of a Career Path report in JSON.

CV:
${sanitized.substring(0, 3000)}

Already generated: current_positioning and next_roles (${existingRoles || 'see CV'}).

Generate ONLY this JSON (no other text):
{
  "development_plan": {
    "formations": [{"name": "...", "provider": "...", "duration": "...", "cost": "...", "relevance": "...", "priority": "Alta|Média|Baixa", "url": null}],
    "certifications": [{"name": "...", "body": "...", "investment": "...", "impact": "...", "priority": "Alta|Média|Baixa"}],
    "visibility_exercises": [{"activity": "...", "platform": "...", "frequency": "...", "expected_impact": "...", "concrete_first_step": "..."}],
    "networking_strategy": [{"action": "...", "target": "...", "entities": [{"name": "...", "type": "community|event|association|conference", "description": "...", "website": null, "location": "...", "frequency": "..."}]}],
    "free_courses": [{"name": "...", "platform": "...", "provider": "...", "duration": "...", "relevance": "...", "search_url": "..."}]
  },
  "immediate_actions": [{"priority": 1, "action": "...", "timeframe": "...", "expected_outcome": "..."}],
  "long_term_vision": {
    "five_year_narrative": "5-7 sentences addressing the professional by name with a specific, inspiring 5-year vision.",
    "key_milestones": [{"year": "Year 1", "milestone": "..."}]
  }
}
Rules: min 4 formations, 3 certifications, 3 free_courses, 4 visibility_exercises, 3 networking actions. All localized for ${marketCtx}. Return ONLY the JSON.`
              : isES
              ? `Eres un Career Advisor de élite. Basándote en este CV, genera SOLO las secciones faltantes del informe Career Path en JSON.

CV:
${sanitized.substring(0, 3000)}

Ya generado: current_positioning y next_roles (${existingRoles || 'ver CV'}).

Genera SOLO este JSON (sin otro texto):
{
  "development_plan": {
    "formations": [{"name": "...", "provider": "...", "duration": "...", "cost": "...", "relevance": "...", "priority": "Alta|Media|Baja", "url": null}],
    "certifications": [{"name": "...", "body": "...", "investment": "...", "impact": "...", "priority": "Alta|Media|Baja"}],
    "visibility_exercises": [{"activity": "...", "platform": "...", "frequency": "...", "expected_impact": "...", "concrete_first_step": "..."}],
    "networking_strategy": [{"action": "...", "target": "...", "entities": [{"name": "...", "type": "community|event|association|conference", "description": "...", "website": null, "location": "...", "frequency": "..."}]}],
    "free_courses": [{"name": "...", "platform": "...", "provider": "...", "duration": "...", "relevance": "...", "search_url": "..."}]
  },
  "immediate_actions": [{"priority": 1, "action": "...", "timeframe": "...", "expected_outcome": "..."}],
  "long_term_vision": {
    "five_year_narrative": "5-7 frases dirigiéndose al profesional por su nombre con una visión específica e inspiradora a 5 años.",
    "key_milestones": [{"year": "Año 1", "milestone": "..."}]
  }
}
Reglas: mín. 4 formaciones, 3 certificaciones, 3 cursos gratuitos, 4 ejercicios de visibilidad, 3 acciones de networking. Todo localizado para ${marketCtx}. Devuelve SOLO el JSON.`
              : `És um Career Advisor de elite. Com base neste CV, gera APENAS as secções em falta do relatório Career Path em JSON.

CV:
${sanitized.substring(0, 3000)}

Já gerado: current_positioning e next_roles (${existingRoles || 'ver CV'}).

Gera APENAS este JSON (sem outro texto):
{
  "development_plan": {
    "formations": [{"name": "...", "provider": "...", "duration": "...", "cost": "...", "relevance": "...", "priority": "Alta|Média|Baixa", "url": null}],
    "certifications": [{"name": "...", "body": "...", "investment": "...", "impact": "...", "priority": "Alta|Média|Baixa"}],
    "visibility_exercises": [{"activity": "...", "platform": "...", "frequency": "...", "expected_impact": "...", "concrete_first_step": "..."}],
    "networking_strategy": [{"action": "...", "target": "...", "entities": [{"name": "...", "type": "community|event|association|conference", "description": "...", "website": null, "location": "...", "frequency": "..."}]}],
    "free_courses": [{"name": "...", "platform": "...", "provider": "...", "duration": "...", "relevance": "...", "search_url": "..."}]
  },
  "immediate_actions": [{"priority": 1, "action": "...", "timeframe": "...", "expected_outcome": "..."}],
  "long_term_vision": {
    "five_year_narrative": "5-7 frases dirigindo-se ao profissional pelo nome com uma visão específica e inspiradora a 5 anos.",
    "key_milestones": [{"year": "Ano 1", "milestone": "..."}]
  }
}
Regras: mín. 4 formações, 3 certificações, 3 cursos gratuitos, 4 exercícios de visibilidade, 3 acções de networking. Tudo localizado para ${marketCtx}. Retorna APENAS o JSON.`;

            const sp2Response = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: secondPassPrompt }] }],
                generationConfig: { temperature: 0.4, topK: 40, topP: 0.95, maxOutputTokens: 32768 }
              })
            });
            if (sp2Response.ok) {
              const sp2Data = await sp2Response.json();
              let sp2Text = sp2Data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              sp2Text = sp2Text.replace(/```json\n?/g, '').replace(/```\n?/g, '').replace(/^[^{]*/, '').trim();
              // Repair sp2 JSON if needed
              let sp2Braces = 0, sp2Brackets = 0, sp2InStr = false, sp2Esc = false;
              for (const ch of sp2Text) {
                if (sp2Esc) { sp2Esc = false; continue; }
                if (ch === '\\') { sp2Esc = true; continue; }
                if (ch === '"') { sp2InStr = !sp2InStr; continue; }
                if (sp2InStr) continue;
                if (ch === '{') sp2Braces++; if (ch === '}') sp2Braces--;
                if (ch === '[') sp2Brackets++; if (ch === ']') sp2Brackets--;
              }
              if (sp2Braces > 0 || sp2Brackets > 0) {
                sp2Text = sp2Text.replace(/,\s*"[^"]*"?\s*:?\s*"?[^"{}\[\]]*$/, '');
                for(let i = 0; i < sp2Brackets; i++) sp2Text += ']';
                for(let i = 0; i < sp2Braces; i++) sp2Text += '}';
              } else {
                sp2Text = sp2Text.replace(/[^}]*$/, '');
              }
              try {
                const sp2Parsed = JSON.parse(sp2Text);
                // Merge second pass into careerPath
                if (careerPath.career_path) {
                  careerPath.career_path = { ...careerPath.career_path, ...sp2Parsed };
                } else {
                  careerPath = { ...careerPath, ...sp2Parsed };
                }
                console.log('✅ Career Path second pass merged successfully');
              } catch (sp2Err) {
                console.warn('⚠️ Second pass JSON parse failed:', sp2Err);
              }
            }
          } catch (sp2Err) {
            console.warn('⚠️ Second pass request failed:', sp2Err);
          }
        }

        console.log(`✅ ${reportLabel} gerado com sucesso`);

        return jsonResponse(mode === 'career_intelligence' ? {

          success: true,

          analysis_type: 'career_intelligence',

          language,

          career_intelligence: careerPath,

          ...careerPath

        } : {

          success: true,

          analysis_type: 'career_path',

          language,

          career_path: careerPath,

          ...careerPath

        });

      } catch (error) {

        console.error(`❌ Erro no modo ${mode}:`, error);

        return jsonResponse({

          success: false,

          error: mode === 'career_intelligence' ? 'Erro ao gerar Career Intelligence' : 'Erro ao gerar Career Path',

          message: error.message

        }, 500);

      }

    }

    // MODE: LinkedIn Audit (Professional LinkedIn Profile Audit)

    if (mode === 'linkedin_roast') {

      console.log('📊 Modo: LinkedIn Audit');

      const linkedinUrl = body.linkedin_url || '';

      const targetArea = body.target_area || '';

      const isES = language === 'es';

      // cvText may already be populated from linkedin_url extraction above

      if ((!cvText || cvText.trim().length < 50) && linkedinUrl) {

        cvText = `LinkedIn Profile URL: ${linkedinUrl}\nNote: Automatic extraction returned limited public data. Analyse the public signals available from the profile URL and clearly flag any missing information instead of assuming the profile is private.`;

      }

      if (!cvText || cvText.length < 50) {

        return jsonResponse({

          success: false,

          error: isEN ? 'Could not extract LinkedIn profile data. Please check the URL is correct and the profile is public, or upload your profile PDF.' : isES ? 'No fue posible extraer los datos del perfil de LinkedIn. Verifica que la URL sea correcta y que el perfil sea público, o sube el PDF de tu perfil.' : 'Não foi possível extrair dados do perfil LinkedIn. Verifica se o URL está correto e o perfil é público, ou faz upload do PDF do teu perfil.'

        }, 400);

      }

      try {

        // Gemini company enrichment for LinkedIn Roast

        const roastCompanyContext = await enrichWithCompanyData(cvText, language);

        const roastOutputLanguageInstruction = getLanguageOutputInstruction(language);

        const roastJsonRepairInstruction = isEN
          ? 'Preserve the existing English content exactly. Do not translate or rewrite the analysis beyond fixing JSON syntax.'
          : isES
            ? 'Conserva exactamente el contenido existente en español. No traduzcas ni reescribas el análisis más allá de corregir la sintaxis JSON.'
            : 'Preserva exatamente o conteúdo existente em Português de Portugal. Não traduzas nem reescrevas a análise além de corrigir a sintaxe JSON.';

        const roastPromptPT = `Atuas como Consultor Sénior de Personal Branding e Estratégia de LinkedIn, com mais de 15 anos de experiência em recrutamento executivo e otimização de perfis para profissionais de topo. O teu tom é PROFISSIONAL, CONSTRUTIVO e DETALHADO — como uma auditoria séria feita por um especialista que quer genuinamente ajudar o profissional a melhorar.



REGRAS ABSOLUTAS DE IDIOMA E TOM:

1. Escreve SEMPRE em Português de Portugal (PT-PT), NUNCA em Português do Brasil.

2. NÃO uses gerúndios — usa "a fazer" em vez de "fazendo".

3. Usa vocabulário PT-PT: "equipa" (não "time"), "gestão" (não "gerenciamento"), "formação" (não "treinamento").

4. NUNCA uses "você" — usa "tu" ou construções impessoais.

5. Tom PROFISSIONAL e RESPEITOSO — sem sarcasmo, sem ironia, sem piadas. Isto é uma auditoria séria de um serviço pago.

6. Sê ESPECÍFICO — referencia dados concretos do perfil (nomes de empresas, cargos, formações, prémios, números). NUNCA faças comentários genéricos que poderiam aplicar-se a qualquer perfil.



INPUT DE DADOS DO PERFIL:

${cvText.substring(0, 8000)}

${roastCompanyContext}

Área de Destino/Alvo: ${targetArea || 'Não especificada (avaliar com base na trajectória actual)'}



ANÁLISE OBRIGATÓRIA — Avalia TODOS estes elementos com base nos dados reais do perfil:



1. HEADLINE: É uma proposta de valor clara ou apenas um cargo? Inclui palavras-chave estratégicas? Comunica diferenciação?

2. SECÇÃO SOBRE (ABOUT): Tem storytelling profissional? Usa 1ª pessoa? Termina com Call to Action? Está otimizada para SEO?

3. EXPERIÊNCIA PROFISSIONAL: Foca-se em conquistas quantificáveis ou são listas de tarefas? As descrições mostram impacto e resultados?

4. COMPETÊNCIAS (SKILLS): Estão alinhadas com a área alvo? Há keywords em falta? Estão ordenadas estrategicamente?

5. FORMAÇÃO ACADÉMICA: Está bem apresentada? Inclui detalhes relevantes (classificações, distinções, programas executivos)?

6. CERTIFICAÇÕES E LICENÇAS: Estão atualizadas? São relevantes para a área?

7. PRÉMIOS E DISTINÇÕES: Estão bem destacados? Poderiam ter mais visibilidade?

8. PUBLICAÇÕES E PROJETOS: Demonstram thought leadership? Estão a ser aproveitados?

9. RECOMENDAÇÕES: Quantidade e qualidade — são suficientes para o nível de senioridade?

10. REDE E ALCANCE: Número de seguidores/conexões, engagement, newsletter — está a ser bem aproveitado?

11. IDIOMAS: Estão completos e com níveis de proficiência?

12. CONSISTÊNCIA GERAL: A narrativa do perfil conta uma história coerente de progressão de carreira? NOTA: experiências paralelas ou simultâneas (ex: empreendedor + empregado, professor + consultor) são perfeitamente normais e NÃO devem ser criticadas como inconsistência.



BENCHMARKING SETORIAL:

Com base na área de atuação do profissional, compara o perfil com as melhores práticas de perfis de topo no mesmo setor. Estima em que percentil o perfil se encontra (ex: top 30% do setor). Identifica os gaps mais significativos em relação aos top performers.



ANÁLISE SEO LINKEDIN:

Avalia a presença de keywords estratégicas em cada secção do perfil. Identifica keywords primárias (essenciais para a área), secundárias (complementares), e keywords em falta. Sugere onde colocar cada keyword para máximo impacto no algoritmo do LinkedIn.



REGRAS DE PROFUNDIDADE NARRATIVA (OBRIGATÓRIO):

- Escreve como um consultor especialista em conversa directa com o profissional — trata-o pelo primeiro nome.

- Cada campo de texto deve ser um parágrafo elaborado, não um bullet point disfarçado de frase.

- Mínimos de palavras: sumario_executivo = 100 palavras; cada analise em dimensoes = 60 palavras; cada analise em scores_seccao = 40 palavras; benchmarking resumo = 80 palavras; cada gap_vs_top = 40 palavras; cada area_melhoria diagnostico+recomendacao = 80 palavras combinados; recomendacao_prioritaria = 80 palavras; analise_formacao e analise_rede = 60 palavras cada; recomendacoes_seo = 80 palavras.

- Referencia sempre dados concretos do perfil — cargo, empresa, número de seguidores, certificação, publicação.

- Varia os inícios de frase — evita repetir o mesmo sujeito em frases consecutivas.



OUTPUT OBRIGATÓRIO (Devolver APENAS em formato JSON válido, sem formatação markdown em volta):

{

  "teaser": {

    "nota_geral": <inteiro 1-10, não string>,

    "hook_vendas": "2 frases máximo. Frase profissional e específica sobre o potencial não aproveitado deste perfil, referenciando um dado concreto do perfil (cargo actual, empresa, prémio específico, número de seguidores, publicação). Suficientemente específico para que o profissional saiba que é sobre ele."

  },

  "analise_completa": {

    "sumario_executivo": "5-7 frases. Resume a avaliação global do perfil tratando o profissional pelo primeiro nome: trajectória de carreira, empregadores actuais e anteriores relevantes, o que o perfil comunica bem, as 2-3 principais oportunidades de melhoria, e uma frase de enquadramento sobre o potencial do perfil. Específico e personalizado — não pode aplicar-se a outro perfil.",

    "visibilidade_algoritmo": "Baixa / Média / Alta — seguido de 2-3 frases de justificação baseadas em dados concretos do perfil (completude, actividade, keywords, engagement observado).",

    "dimensoes": {

      "headline_sumario": {

        "score": "<inteiro 1-10>",

        "analise": "3-4 frases. Avalia a headline e secção Sobre referenciando o conteúdo real: cita a headline actual, avalia se é proposta de valor ou apenas cargo, identifica keywords presentes e ausentes, e avalia o About quanto a storytelling, 1ª pessoa, CTA e extensão."

      },

      "experiencia_conteudo": {

        "score": "<inteiro 1-10>",

        "analise": "3-4 frases. Avalia as descrições de experiência referenciando funções e empresas reais do perfil: proporção conquistas vs tarefas, presença de métricas e resultados quantificados, verbos de acção, e legibilidade das descrições."

      },

      "formacao_certificacoes": {

        "score": "<inteiro 1-10>",

        "analise": "3-4 frases. Avalia a formação e certificações referenciando graus e certificações reais do perfil: nível académico adequado para a área, atualidade das certificações, o que está em falta para o nível de senioridade identificado."

      },

      "rede_alcance": {

        "score": "<inteiro 1-10>",

        "analise": "3-4 frases. Avalia a rede e alcance com dados concretos do perfil: número de seguidores/conexões se disponível, presença de newsletter, frequência de publicações, engagement visível, e qualidade aparente da rede para a área de actuação."

      },

      "seo_keywords": {

        "score": "<inteiro 1-10>",

        "analise": "3-4 frases. Avalia a densidade e estratégia de keywords: quais keywords-chave da área estão presentes, em que secções, quais estão completamente ausentes, e qual o impacto estimado na pesquisa de recrutadores."

      }

    },

    "scores_seccao": {

      "headline": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Cita a headline actual, avalia: é proposta de valor ou apenas cargo, contém keywords estratégicas, diferencia o profissional no mercado. Sugere o que alterar."

      },

      "about": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia a secção Sobre: tem storytelling profissional, usa 1ª pessoa, termina com CTA, está optimizada para SEO, tem extensão adequada (1500-2000 caracteres ideal). Referencia o conteúdo real se disponível."

      },

      "experience": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia as descrições de experiência: proporção conquistas/tarefas, métricas de impacto presentes, verbos de acção fortes. Referencia cargos e empresas reais do perfil."

      },

      "skills": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia as competências: alinhamento com a área alvo, ordenação estratégica (competências mais relevantes em primeiro), keywords em falta, e quantidade (ideal: 50 competências com endorsements)."

      },

      "education": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia a formação: apresentação adequada, inclui detalhes relevantes (classificações, actividades, programas executivos), adequação ao nível de senioridade do perfil. Referencia formações reais."

      },

      "certifications": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia as certificações: atualidade, relevância para a área, o que falta dado o nível de senioridade e os requisitos do mercado para esta área. Referencia certificações reais do perfil."

      },

      "recommendations": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia as recomendações: quantidade (benchmark: 5+ para sénior), qualidade e especificidade, diversidade de fontes (pares, superiores, clientes), adequação ao nível de senioridade."

      },

      "network": {

        "score": "<inteiro 1-10>",

        "analise": "3 frases. Avalia a rede: dimensão relativa ao tempo de carreira, qualidade aparente (presença de decisores, líderes de área), engagement com o conteúdo, e aproveitamento da rede para visibilidade."

      }

    },

    "benchmarking": {

      "setor": "Nome específico do setor/indústria identificado no perfil",

      "percentil_estimado": "<inteiro 1-100 — onde 1=bottom, 100=top do setor>",

      "resumo": "4-5 frases. Posiciona o perfil face aos top performers do setor referenciando o nome do profissional: o que os melhores perfis nesta área têm que este ainda não tem, onde este perfil já é competitivo, e o que o colocaria no top 10-20% do setor.",

      "gaps_vs_top": [

        { "area": "Nome específico da área (ex: Thought Leadership, Personal Branding Visual)", "gap": "2-3 frases. Descreve o gap concreto face aos top performers do setor nesta área específica, com exemplos do que os melhores fazem que este perfil não faz." },

        { "area": "Área 2", "gap": "2-3 frases específicas." },

        { "area": "Área 3", "gap": "2-3 frases específicas." },

        { "area": "Área 4 — opcional", "gap": "2-3 frases específicas." }

      ],

      "vantagens_competitivas": [

        "Vantagem competitiva 1 — específica, referenciando dados reais (ex: 'Combinação rara de experiência Big 4 + sector farmacêutico poucos profissionais de RH possuem em Portugal')",

        "Vantagem competitiva 2 — específica",

        "Vantagem competitiva 3 — específica"

      ]

    },

    "seo_linkedin": {

      "keywords_primarias": ["6-8 keywords essenciais para a área deste profissional — específicas ao seu campo"],

      "keywords_secundarias": ["6-8 keywords complementares relevantes para a área"],

      "keywords_em_falta": ["4-6 keywords importantes que NÃO estão no perfil mas deviam estar dado o cargo e área"],

      "keywords_por_seccao": {

        "headline": ["3-4 keywords recomendadas especificamente para a headline deste profissional"],

        "about": ["4-5 keywords para integrar naturalmente na secção Sobre"],

        "experience": ["3-4 keywords para reforçar nas descrições de experiência"],

        "skills": ["4-6 keywords para adicionar à lista de competências"]

      },

      "densidade_score": "<inteiro 1-10>",

      "recomendacoes_seo": "4-5 frases com recomendações específicas e accionáveis para melhorar a visibilidade nas pesquisas de recrutadores. Nomeia secções concretas, keywords específicas e onde colocá-las para máximo impacto no algoritmo do LinkedIn."

    },

    "pontos_fortes": [

      "Ponto forte 1 — 2 frases. Específico, referenciando dados reais do perfil (empregador, cargo, realização, certificação, número). Explica porque isto é uma vantagem no mercado.",

      "Ponto forte 2 — 2 frases. Específico.",

      "Ponto forte 3 — 2 frases. Específico.",

      "Ponto forte 4 — 2 frases. Opcional para perfis seniores."

    ],

    "areas_melhoria": [

      {

        "area": "Nome específico da área (ex: Secção Sobre, Descrições de Experiência na [Empresa X])",

        "diagnostico": "3-4 frases. Diagnóstico detalhado e específico do problema, referenciando o conteúdo actual do perfil. O que existe, o que falta, e o impacto concreto deste problema na visibilidade e nas candidaturas.",

        "recomendacao": "3-4 frases. Recomendação concreta e accionável: o que fazer, como fazê-lo, e um exemplo específico de como ficaria depois da melhoria."

      },

      {

        "area": "Área 2",

        "diagnostico": "3-4 frases específicas.",

        "recomendacao": "3-4 frases concretas."

      },

      {

        "area": "Área 3",

        "diagnostico": "3-4 frases específicas.",

        "recomendacao": "3-4 frases concretas."

      }

    ],

    "headlines_sugeridas": [

      "Opção 1 — headline completa pronta a usar, optimizada para SEO e com proposta de valor clara, usando dados reais do perfil (cargo, área, especialização). Máx 220 caracteres.",

      "Opção 2 — variante com ênfase diferente (ex: mais focada em resultados ou em especialização específica). Máx 220 caracteres.",

      "Opção 3 — variante mais ousada ou diferenciadora. Máx 220 caracteres."

    ],

    "dicas_seo": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"],

    "analise_formacao": "3-4 frases sobre a formação académica e certificações deste profissional especificamente: o que está bem apresentado, o que pode melhorar, e que credenciais adicionais fortaleceriam o perfil na área de actuação. Referencia formações e certificações reais do perfil.",

    "analise_rede": "3-4 frases sobre a rede, alcance e presença digital deste profissional: dimensão relativa ao nível de senioridade e tempo de carreira, qualidade aparente da rede, actividade de conteúdo, e como melhor aproveitar a rede actual para aumentar a visibilidade.",

    "recomendacao_prioritaria": "4-5 frases. A alteração mais importante e de maior impacto imediato que este profissional deve fazer. Deve ser concreta, accionável, específica a este perfil, e explicar o impacto esperado nos próximos 30-60 dias em termos de visibilidade ou candidaturas."

  }

}



REGRAS FINAIS:

- NUNCA critiques sobreposição de datas entre experiências profissionais — é perfeitamente normal ter múltiplos cargos em simultâneo (professores, médicos, consultores, empreendedores, freelancers, cargos paralelos). Isto NÃO é uma inconsistência nem um problema.

- NUNCA critiques datas futuras em experiências — podem representar cargos já confirmados que começam em breve.

- Cada campo DEVE conter conteúdo específico ao perfil analisado. Se mencionas uma empresa, usa o nome real. Se mencionas uma formação, usa a formação real.

- As "areas_melhoria" devem ter SEMPRE pelo menos 3 itens, cada um com diagnóstico e recomendação detalhados.

- Os "pontos_fortes" devem ter SEMPRE pelo menos 3 itens que reconheçam genuinamente o que o perfil faz bem.

- A nota deve refletir objectivamente a qualidade do perfil — um perfil com boa experiência, prémios e publicações NÃO deve ter nota baixa.

- VARIABILIDADE DE SCORES: Os scores das dimensões e secções DEVEM variar entre si — não podem ser todos iguais nem muito próximos. Secções mais fracas devem pontuar claramente menos que secções fortes.

- O campo "dimensoes" DEVE conter objectos com "score" (inteiro 1-10) e "analise" (texto explicativo de 2-3 frases) para cada dimensão, avaliados independentemente.

- O campo "scores_seccao" DEVE conter scores independentes para cada secção do perfil LinkedIn (headline, about, experience, skills, education, certifications, recommendations, network), cada um com "score" (inteiro 1-10) e "analise" (2-3 frases específicas).

- O campo "benchmarking" DEVE posicionar o perfil face ao setor, com "percentil_estimado" como inteiro 1-100 (onde 1=bottom, 100=top), gaps concretos vs top performers, e vantagens competitivas.

- O campo "seo_linkedin" DEVE conter keywords primárias, secundárias, em falta, por secção, e recomendações SEO específicas.

- Toda a análise deve ter valor real para o profissional — algo que justifique o investimento de 1,99€.

- NUNCA uses comentários genéricos que possam aplicar-se a qualquer perfil. Cada frase deve ser específica a este profissional.`;

        const roastPromptEN = `You are a Senior Personal Branding & LinkedIn Strategy Consultant with over 15 years of experience in executive recruitment and profile optimisation for top professionals. Your tone is PROFESSIONAL, CONSTRUCTIVE and DETAILED — like a serious audit conducted by a specialist who genuinely wants to help the professional improve.



ABSOLUTE LANGUAGE AND TONE RULES:

1. Write ALWAYS in English.

2. Tone must be PROFESSIONAL and RESPECTFUL — no sarcasm, no irony, no jokes. This is a serious audit from a paid service.

3. Be SPECIFIC — reference concrete data from the profile (company names, job titles, qualifications, awards, numbers). NEVER make generic comments that could apply to any profile.



PROFILE DATA INPUT:

${cvText.substring(0, 8000)}

${roastCompanyContext}



Target Professional Area: ${targetArea || 'Not specified (evaluate based on current career trajectory)'}



MANDATORY ANALYSIS — Evaluate ALL these elements based on the real profile data:



1. HEADLINE: Is it a clear value proposition or just a job title? Does it include strategic keywords? Does it communicate differentiation?

2. ABOUT SECTION: Does it have professional storytelling? Uses 1st person? Ends with a Call to Action? Is it SEO-optimised?

3. PROFESSIONAL EXPERIENCE: Focuses on quantifiable achievements or are they task lists? Do descriptions show impact and results?

4. SKILLS: Are they aligned with the target area? Are there missing keywords? Are they strategically ordered?

5. EDUCATION: Is it well presented? Includes relevant details (grades, distinctions, executive programmes)?

6. CERTIFICATIONS & LICENCES: Are they up to date? Are they relevant to the field?

7. AWARDS & HONOURS: Are they well highlighted? Could they have more visibility?

8. PUBLICATIONS & PROJECTS: Do they demonstrate thought leadership? Are they being leveraged?

9. RECOMMENDATIONS: Quantity and quality — are they sufficient for the seniority level?

10. NETWORK & REACH: Number of followers/connections, engagement, newsletter — is it being well leveraged?

11. LANGUAGES: Are they complete with proficiency levels?

12. OVERALL CONSISTENCY: Does the profile narrative tell a coherent story of career progression? NOTE: parallel or simultaneous experiences (e.g., entrepreneur + employee, professor + consultant) are perfectly normal and MUST NOT be criticised as inconsistency.



SECTOR BENCHMARKING:

Based on the professional's field, compare the profile against best practices from top profiles in the same sector. Estimate which percentile the profile falls into (e.g., top 30% of the sector). Identify the most significant gaps compared to top performers.



LINKEDIN SEO ANALYSIS:

Evaluate the presence of strategic keywords in each profile section. Identify primary keywords (essential for the field), secondary keywords (complementary), and missing keywords. Suggest where to place each keyword for maximum impact on the LinkedIn algorithm.



NARRATIVE DEPTH RULES (MANDATORY):

- Write as a specialist consultant in direct conversation with the professional — address them by first name.

- Every text field must be a crafted paragraph, not a disguised bullet point.

- Minimum word counts: sumario_executivo = 100 words; each analise in dimensoes = 60 words; each analise in scores_seccao = 40 words; benchmarking resumo = 80 words; each gap_vs_top = 40 words; each areas_melhoria diagnostico+recomendacao combined = 80 words; recomendacao_prioritaria = 80 words; analise_formacao and analise_rede = 60 words each; recomendacoes_seo = 80 words.

- Always reference concrete profile data — role, company, follower count, certification, publication.

- Vary sentence openers — avoid starting consecutive sentences with the same subject.



MANDATORY OUTPUT (Return ONLY valid JSON, no markdown formatting around it):

{

  "teaser": {

    "nota_geral": <integer 1-10, not a string>,

    "hook_vendas": "Maximum 2 sentences. Professional and specific sentence about the untapped potential of this profile, referencing a concrete data point (current role, employer, specific award, follower count, publication). Specific enough that the professional knows it is about them."

  },

  "analise_completa": {

    "sumario_executivo": "5-7 sentences. Summarise the overall profile assessment addressing the professional by first name: career trajectory, current and relevant past employers, what the profile communicates well, the 2-3 main improvement opportunities, and a framing sentence about the profile's potential. Specific and personalised — cannot apply to any other profile.",

    "visibilidade_algoritmo": "Low / Medium / High — followed by 2-3 sentences of justification based on concrete profile data (completeness, activity, keywords, observed engagement).",

    "dimensoes": {

      "headline_sumario": {

        "score": "<integer 1-10>",

        "analise": "3-4 sentences. Evaluate the headline and About section referencing real content: quote or describe the actual headline, assess whether it is a value proposition or just a job title, identify present and missing keywords, and evaluate the About for storytelling, first person, CTA and length."

      },

      "experiencia_conteudo": {

        "score": "<integer 1-10>",

        "analise": "3-4 sentences. Evaluate experience descriptions referencing real roles and companies from the profile: ratio of achievements vs tasks, presence of quantified metrics and results, action verbs, and readability of descriptions."

      },

      "formacao_certificacoes": {

        "score": "<integer 1-10>",

        "analise": "3-4 sentences. Evaluate education and certifications referencing real qualifications from the profile: academic level appropriate for the field, currency of certifications, what is missing for the identified seniority level."

      },

      "rede_alcance": {

        "score": "<integer 1-10>",

        "analise": "3-4 sentences. Evaluate network and reach with concrete profile data: follower/connection count if available, newsletter presence, publication frequency, visible engagement, and apparent network quality for the field."

      },

      "seo_keywords": {

        "score": "<integer 1-10>",

        "analise": "3-4 sentences. Evaluate keyword density and strategy: which key field keywords are present and in which sections, which are completely absent, and the estimated impact on recruiter search visibility."

      }

    },

    "scores_seccao": {

      "headline": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Quote or describe the actual headline, evaluate: is it a value proposition or just a job title, does it contain strategic keywords, does it differentiate in the market. Suggest what to change."

      },

      "about": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate the About section: professional storytelling, first person, ends with CTA, SEO-optimised, appropriate length (1500-2000 characters ideal). Reference actual content if available."

      },

      "experience": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate experience descriptions: achievements/tasks ratio, impact metrics present, strong action verbs. Reference actual roles and companies from the profile."

      },

      "skills": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate skills: alignment with target area, strategic ordering (most relevant first), missing keywords, and quantity (ideal: 50 skills with endorsements)."

      },

      "education": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate education: adequate presentation, relevant details included (grades, activities, executive programmes), appropriateness for the profile's seniority level. Reference actual qualifications."

      },

      "certifications": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate certifications: currency, relevance to field, what is missing given the seniority level and market requirements for this area. Reference actual certifications from the profile."

      },

      "recommendations": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate recommendations: quantity (benchmark: 5+ for senior), quality and specificity, source diversity (peers, superiors, clients), adequacy for seniority level."

      },

      "network": {

        "score": "<integer 1-10>",

        "analise": "3 sentences. Evaluate network: size relative to career length, apparent quality (presence of decision-makers, field leaders), engagement with content, and leverage of network for visibility."

      }

    },

    "benchmarking": {

      "setor": "Specific sector/industry name identified in the profile",

      "percentil_estimado": "<integer 1-100 — where 1=bottom, 100=top of sector>",

      "resumo": "4-5 sentences. Position the profile against top performers in the sector, addressing the professional by first name: what the best profiles in this field have that this one does not yet, where this profile is already competitive, and what would place them in the top 10-20% of the sector.",

      "gaps_vs_top": [

        { "area": "Specific area name (e.g., Thought Leadership, Visual Personal Branding)", "gap": "2-3 sentences. Describe the concrete gap vs top performers in this specific area, with examples of what the best profiles do that this one does not." },

        { "area": "Area 2", "gap": "2-3 specific sentences." },

        { "area": "Area 3", "gap": "2-3 specific sentences." },

        { "area": "Area 4 — optional", "gap": "2-3 specific sentences." }

      ],

      "vantagens_competitivas": [

        "Competitive advantage 1 — specific, referencing real data (e.g., 'Rare combination of Big 4 background and pharma sector experience that few HR professionals in this market possess')",

        "Competitive advantage 2 — specific",

        "Competitive advantage 3 — specific"

      ]

    },

    "seo_linkedin": {

      "keywords_primarias": ["6-8 essential keywords for this professional's specific field"],

      "keywords_secundarias": ["6-8 complementary keywords relevant to the field"],

      "keywords_em_falta": ["4-6 important keywords NOT in the profile but should be given the role and field"],

      "keywords_por_seccao": {

        "headline": ["3-4 keywords specifically recommended for this professional's headline"],

        "about": ["4-5 keywords to integrate naturally in the About section"],

        "experience": ["3-4 keywords to reinforce in experience descriptions"],

        "skills": ["4-6 keywords to add to the skills list"]

      },

      "densidade_score": "<integer 1-10>",

      "recomendacoes_seo": "4-5 sentences with specific and actionable recommendations to improve visibility in recruiter searches. Name specific sections, specific keywords and where to place them for maximum impact on the LinkedIn algorithm."

    },

    "pontos_fortes": [

      "Strength 1 — 2 sentences. Specific, referencing real profile data (employer, role, achievement, certification, number). Explain why this is a market advantage.",

      "Strength 2 — 2 sentences. Specific.",

      "Strength 3 — 2 sentences. Specific.",

      "Strength 4 — 2 sentences. Optional for senior profiles."

    ],

    "areas_melhoria": [

      {

        "area": "Specific area name (e.g., About Section, Experience Descriptions at [Company X])",

        "diagnostico": "3-4 sentences. Detailed and specific diagnosis of the problem, referencing the actual profile content. What exists, what is missing, and the concrete impact of this problem on visibility and applications.",

        "recomendacao": "3-4 sentences. Concrete and actionable recommendation: what to do, how to do it, and a specific example of what it would look like after the improvement."

      },

      {

        "area": "Area 2",

        "diagnostico": "3-4 specific sentences.",

        "recomendacao": "3-4 concrete sentences."

      },

      {

        "area": "Area 3",

        "diagnostico": "3-4 specific sentences.",

        "recomendacao": "3-4 concrete sentences."

      }

    ],

    "headlines_sugeridas": [

      "Option 1 — complete ready-to-use headline, SEO-optimised with clear value proposition, using real profile data (role, field, specialisation). Max 220 characters.",

      "Option 2 — variant with different emphasis (e.g., more results-focused or specific specialisation). Max 220 characters.",

      "Option 3 — bolder or more differentiating variant. Max 220 characters."

    ],

    "dicas_seo": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"],

    "analise_formacao": "3-4 sentences about this professional's education and certifications specifically: what is well presented, what can improve, and what additional credentials would strengthen the profile in their field. Reference actual qualifications from the profile.",

    "analise_rede": "3-4 sentences about this professional's network, reach and digital presence: size relative to seniority level and career length, apparent network quality, content activity, and how to best leverage the current network to increase visibility.",

    "recomendacao_prioritaria": "4-5 sentences. The most important highest-impact change this professional should make first. Must be concrete, actionable, specific to this profile, and explain the expected impact in the next 30-60 days in terms of visibility or applications."

  }

}



FINAL RULES:

- NEVER criticise overlapping dates between professional experiences — it is perfectly normal to hold multiple roles simultaneously (teachers, doctors, consultants, entrepreneurs, freelancers, parallel roles). This is NOT an inconsistency nor a problem.

- NEVER criticise future dates in experiences — they may represent confirmed roles starting soon.

- Each field MUST contain content specific to the analysed profile. If you mention a company, use the real name. If you mention a qualification, use the real qualification.

- "areas_melhoria" must ALWAYS have at least 3 items, each with detailed diagnosis and recommendation.

- "pontos_fortes" must ALWAYS have at least 3 items that genuinely acknowledge what the profile does well.

- The score must objectively reflect the profile quality — a profile with good experience, awards and publications MUST NOT have a low score.

- SCORE VARIABILITY: Scores across dimensions and sections MUST vary — they cannot all be the same or very similar. Weaker sections must score clearly lower than stronger ones.

- The "dimensoes" field MUST contain objects with "score" (integer 1-10) and "analise" (2-3 sentence explanatory text) for each dimension, evaluated independently.

- The "scores_seccao" field MUST contain independent scores for each LinkedIn profile section (headline, about, experience, skills, education, certifications, recommendations, network), each with "score" (integer 1-10) and "analise" (2-3 specific sentences).

- The "benchmarking" field MUST position the profile against the sector, with "percentil_estimado" as integer 1-100 (where 1=bottom, 100=top), concrete gaps vs top performers, and competitive advantages.

- The "seo_linkedin" field MUST contain primary, secondary, missing keywords, keywords by section, and specific SEO recommendations.

- The entire analysis must provide real value to the professional — something that justifies the investment.

- NEVER make generic comments that could apply to any profile. Every sentence must be specific to this professional.`;

        const roastPromptES = `Actúas como Consultor Sénior de Personal Branding y Estrategia de LinkedIn, con más de 15 años de experiencia en reclutamiento ejecutivo y optimización de perfiles para profesionales de alto nivel. Tu tono es PROFESIONAL, CONSTRUCTIVO y DETALLADO — como una auditoría seria realizada por un especialista que realmente quiere ayudar al profesional a mejorar.



REGLAS ABSOLUTAS DE IDIOMA Y TONO:

1. Escribe SIEMPRE en Español.

2. El tono debe ser PROFESIONAL y RESPETUOSO — sin sarcasmo, sin ironía y sin bromas. Esta es una auditoría seria de un servicio de pago.

3. Sé ESPECÍFICO — referencia datos concretos del perfil (nombres de empresas, cargos, estudios, premios, cifras). NUNCA hagas comentarios genéricos que puedan aplicarse a cualquier perfil.



DATOS DE ENTRADA DEL PERFIL:

${cvText.substring(0, 8000)}

${roastCompanyContext}

Área Objetivo: ${targetArea || 'No especificada (evalúa según la trayectoria profesional actual)'}



ANÁLISIS OBLIGATORIO — Evalúa TODOS estos elementos en base a los datos reales del perfil:



1. HEADLINE: ¿Es una propuesta de valor clara o solo un cargo? ¿Incluye keywords estratégicas? ¿Comunica diferenciación?

2. SECCIÓN ACERCA DE (ABOUT): ¿Tiene storytelling profesional? ¿Usa primera persona? ¿Termina con un Call to Action? ¿Está optimizada para SEO?

3. EXPERIENCIA PROFESIONAL: ¿Se centra en logros cuantificables o son listas de tareas? ¿Las descripciones muestran impacto y resultados?

4. COMPETENCIAS (SKILLS): ¿Están alineadas con el área objetivo? ¿Faltan keywords? ¿Están ordenadas estratégicamente?

5. FORMACIÓN ACADÉMICA: ¿Está bien presentada? ¿Incluye detalles relevantes (calificaciones, distinciones, programas ejecutivos)?

6. CERTIFICACIONES Y LICENCIAS: ¿Están actualizadas? ¿Son relevantes para el campo?

7. PREMIOS Y DISTINCIONES: ¿Están bien destacados? ¿Podrían tener más visibilidad?

8. PUBLICACIONES Y PROYECTOS: ¿Demuestran thought leadership? ¿Se están aprovechando?

9. RECOMENDACIONES: Cantidad y calidad — ¿son suficientes para el nivel de seniority?

10. RED Y ALCANCE: Número de seguidores/conexiones, engagement, newsletter — ¿se está aprovechando bien?

11. IDIOMAS: ¿Están completos y con niveles de competencia?

12. CONSISTENCIA GENERAL: ¿La narrativa del perfil cuenta una historia coherente de progresión profesional? NOTA: experiencias paralelas o simultáneas (ej: emprendedor + empleado, profesor + consultor) son perfectamente normales y NO deben criticarse como inconsistencia.



BENCHMARKING SECTORIAL:

En base al campo de actuación del profesional, compara el perfil con las mejores prácticas de perfiles de referencia en el mismo sector. Estima en qué percentil se encuentra el perfil (ej: top 30% del sector). Identifica las brechas más significativas respecto a los top performers.



ANÁLISIS SEO LINKEDIN:

Evalúa la presencia de keywords estratégicas en cada sección del perfil. Identifica keywords primarias (esenciales para el campo), secundarias (complementarias) y keywords ausentes. Sugiere dónde colocar cada keyword para máximo impacto en el algoritmo de LinkedIn.



REGLAS DE PROFUNDIDAD NARRATIVA (OBLIGATORIO):

- Escribe como un consultor especialista en conversación directa con el profesional — dirígete a él/ella por su nombre de pila.

- Cada campo de texto debe ser un párrafo elaborado, no un bullet point disfrazado de frase.

- Mínimos de palabras: sumario_executivo = 100 palabras; cada analise en dimensoes = 60 palabras; cada analise en scores_seccao = 40 palabras; benchmarking resumo = 80 palabras; cada gap_vs_top = 40 palabras; cada area_melhoria diagnostico+recomendacao = 80 palabras combinados; recomendacao_prioritaria = 80 palabras; analise_formacao y analise_rede = 60 palabras cada uno; recomendacoes_seo = 80 palabras.

- Referencia siempre datos concretos del perfil — cargo, empresa, número de seguidores, certificación, publicación.

- Varía los inicios de frase — evita empezar frases consecutivas con el mismo sujeto.



OUTPUT OBLIGATORIO (Devolver SOLO en formato JSON válido, sin formato markdown alrededor):

{

  "teaser": {

    "nota_geral": <entero 1-10, no string>,

    "hook_vendas": "2 frases máximo. Frase profesional y específica sobre el potencial no aprovechado de este perfil, referenciando un dato concreto del perfil (cargo actual, empresa, premio específico, número de seguidores, publicación). Suficientemente específico para que el profesional sepa que es sobre él."

  },

  "analise_completa": {

    "sumario_executivo": "5-7 frases. Resume la evaluación global del perfil dirigiéndose al profesional por su nombre de pila: trayectoria profesional, empleadores actuales y anteriores relevantes, lo que el perfil comunica bien, las 2-3 principales oportunidades de mejora, y una frase de encuadre sobre el potencial del perfil. Específico y personalizado — no puede aplicarse a otro perfil.",

    "visibilidade_algoritmo": "Baja / Media / Alta — seguido de 2-3 frases de justificación basadas en datos concretos del perfil (completitud, actividad, keywords, engagement observado).",

    "dimensoes": {

      "headline_sumario": {

        "score": "<entero 1-10>",

        "analise": "3-4 frases. Evalúa la headline y sección Acerca de referenciando el contenido real: cita la headline actual, evalúa si es propuesta de valor o solo un cargo, identifica keywords presentes y ausentes, y evalúa el About en cuanto a storytelling, primera persona, CTA y extensión."

      },

      "experiencia_conteudo": {

        "score": "<entero 1-10>",

        "analise": "3-4 frases. Evalúa las descripciones de experiencia referenciando funciones y empresas reales del perfil: proporción logros vs tareas, presencia de métricas y resultados cuantificados, verbos de acción, y legibilidad de las descripciones."

      },

      "formacao_certificacoes": {

        "score": "<entero 1-10>",

        "analise": "3-4 frases. Evalúa la formación y certificaciones referenciando títulos y certificaciones reales del perfil: nivel académico adecuado para el campo, actualidad de las certificaciones, lo que falta para el nivel de seniority identificado."

      },

      "rede_alcance": {

        "score": "<entero 1-10>",

        "analise": "3-4 frases. Evalúa la red y alcance con datos concretos del perfil: número de seguidores/conexiones si está disponible, presencia de newsletter, frecuencia de publicaciones, engagement visible, y calidad aparente de la red para el campo de actuación."

      },

      "seo_keywords": {

        "score": "<entero 1-10>",

        "analise": "3-4 frases. Evalúa la densidad y estrategia de keywords: qué keywords clave del campo están presentes, en qué secciones, cuáles están completamente ausentes, y cuál es el impacto estimado en la búsqueda de reclutadores."

      }

    },

    "scores_seccao": {

      "headline": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Cita la headline actual, evalúa: ¿es propuesta de valor o solo un cargo?, ¿contiene keywords estratégicas?, ¿diferencia al profesional en el mercado? Sugiere qué cambiar."

      },

      "about": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa la sección Acerca de: storytelling profesional, primera persona, termina con CTA, optimizada para SEO, extensión adecuada (1500-2000 caracteres ideal). Referencia el contenido real si está disponible."

      },

      "experience": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa las descripciones de experiencia: proporción logros/tareas, métricas de impacto presentes, verbos de acción fuertes. Referencia cargos y empresas reales del perfil."

      },

      "skills": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa las competencias: alineación con el área objetivo, ordenación estratégica (competencias más relevantes primero), keywords faltantes, y cantidad (ideal: 50 competencias con endorsements)."

      },

      "education": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa la formación: presentación adecuada, incluye detalles relevantes (calificaciones, actividades, programas ejecutivos), adecuación al nivel de seniority del perfil. Referencia formaciones reales."

      },

      "certifications": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa las certificaciones: actualidad, relevancia para el campo, lo que falta dado el nivel de seniority y los requisitos del mercado para esta área. Referencia certificaciones reales del perfil."

      },

      "recommendations": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa las recomendaciones: cantidad (benchmark: 5+ para sénior), calidad y especificidad, diversidad de fuentes (pares, superiores, clientes), adecuación al nivel de seniority."

      },

      "network": {

        "score": "<entero 1-10>",

        "analise": "3 frases. Evalúa la red: dimensión relativa al tiempo de carrera, calidad aparente (presencia de decisores, líderes del campo), engagement con el contenido, y aprovechamiento de la red para visibilidad."

      }

    },

    "benchmarking": {

      "setor": "Nombre específico del sector/industria identificado en el perfil",

      "percentil_estimado": "<entero 1-100 — donde 1=bottom, 100=top del sector>",

      "resumo": "4-5 frases. Posiciona el perfil frente a los top performers del sector dirigiéndose al profesional por su nombre: qué tienen los mejores perfiles de esta área que este aún no tiene, dónde este perfil ya es competitivo, y qué lo colocaría en el top 10-20% del sector.",

      "gaps_vs_top": [

        { "area": "Nombre específico del área (ej: Thought Leadership, Personal Branding Visual)", "gap": "2-3 frases. Describe la brecha concreta frente a los top performers del sector en esta área específica, con ejemplos de lo que los mejores hacen que este perfil no hace." },

        { "area": "Área 2", "gap": "2-3 frases específicas." },

        { "area": "Área 3", "gap": "2-3 frases específicas." },

        { "area": "Área 4 — opcional", "gap": "2-3 frases específicas." }

      ],

      "vantagens_competitivas": [

        "Ventaja competitiva 1 — específica, referenciando datos reales (ej: 'Combinación poco frecuente de experiencia en Big 4 + sector farmacéutico que pocos profesionales de RRHH poseen en este mercado')",

        "Ventaja competitiva 2 — específica",

        "Ventaja competitiva 3 — específica"

      ]

    },

    "seo_linkedin": {

      "keywords_primarias": ["6-8 keywords esenciales para el campo de este profesional — específicas a su área"],

      "keywords_secundarias": ["6-8 keywords complementarias relevantes para el campo"],

      "keywords_em_falta": ["4-6 keywords importantes que NO están en el perfil pero deberían estar dado el cargo y área"],

      "keywords_por_seccao": {

        "headline": ["3-4 keywords recomendadas específicamente para la headline de este profesional"],

        "about": ["4-5 keywords para integrar naturalmente en la sección Acerca de"],

        "experience": ["3-4 keywords para reforzar en las descripciones de experiencia"],

        "skills": ["4-6 keywords para añadir a la lista de competencias"]

      },

      "densidade_score": "<entero 1-10>",

      "recomendacoes_seo": "4-5 frases con recomendaciones específicas y accionables para mejorar la visibilidad en las búsquedas de reclutadores. Nombra secciones concretas, keywords específicas y dónde colocarlas para máximo impacto en el algoritmo de LinkedIn."

    },

    "pontos_fortes": [

      "Punto fuerte 1 — 2 frases. Específico, referenciando datos reales del perfil (empleador, cargo, logro, certificación, cifra). Explica por qué esto es una ventaja en el mercado.",

      "Punto fuerte 2 — 2 frases. Específico.",

      "Punto fuerte 3 — 2 frases. Específico.",

      "Punto fuerte 4 — 2 frases. Opcional para perfiles sénior."

    ],

    "areas_melhoria": [

      {

        "area": "Nombre específico del área (ej: Sección Acerca de, Descripciones de Experiencia en [Empresa X])",

        "diagnostico": "3-4 frases. Diagnóstico detallado y específico del problema, referenciando el contenido actual del perfil. Qué existe, qué falta, y el impacto concreto de este problema en la visibilidad y en las candidaturas.",

        "recomendacao": "3-4 frases. Recomendación concreta y accionable: qué hacer, cómo hacerlo, y un ejemplo específico de cómo quedaría después de la mejora."

      },

      {

        "area": "Área 2",

        "diagnostico": "3-4 frases específicas.",

        "recomendacao": "3-4 frases concretas."

      },

      {

        "area": "Área 3",

        "diagnostico": "3-4 frases específicas.",

        "recomendacao": "3-4 frases concretas."

      }

    ],

    "headlines_sugeridas": [

      "Opción 1 — headline completa lista para usar, optimizada para SEO y con propuesta de valor clara, usando datos reales del perfil (cargo, área, especialización). Máx 220 caracteres.",

      "Opción 2 — variante con énfasis diferente (ej: más enfocada en resultados o en especialización específica). Máx 220 caracteres.",

      "Opción 3 — variante más audaz o diferenciadora. Máx 220 caracteres."

    ],

    "dicas_seo": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"],

    "analise_formacao": "3-4 frases sobre la formación académica y certificaciones de este profesional específicamente: qué está bien presentado, qué puede mejorar, y qué credenciales adicionales fortalecerían el perfil en su campo de actuación. Referencia formaciones y certificaciones reales del perfil.",

    "analise_rede": "3-4 frases sobre la red, alcance y presencia digital de este profesional: dimensión relativa al nivel de seniority y tiempo de carrera, calidad aparente de la red, actividad de contenido, y cómo aprovechar mejor la red actual para aumentar la visibilidad.",

    "recomendacao_prioritaria": "4-5 frases. El cambio más importante y de mayor impacto inmediato que este profesional debe hacer. Debe ser concreto, accionable, específico de este perfil, y explicar el impacto esperado en los próximos 30-60 días en términos de visibilidad o candidaturas."

  }

}



REGLAS FINALES:

- NUNCA critiques solapamientos de fechas entre experiencias profesionales — es perfectamente normal tener varios cargos a la vez (profesores, médicos, consultores, emprendedores, freelancers, cargos paralelos). Esto NO es una inconsistencia ni un problema.

- NUNCA critiques fechas futuras en experiencias — pueden representar cargos ya confirmados que empiezan pronto.

- Cada campo DEBE contener contenido específico del perfil analizado. Si mencionas una empresa, usa el nombre real. Si mencionas una formación, usa la formación real.

- Las "areas_melhoria" deben tener SIEMPRE al menos 3 ítems, cada uno con diagnóstico y recomendación detallados.

- Los "pontos_fortes" deben tener SIEMPRE al menos 3 ítems que reconozcan de forma genuina lo que el perfil hace bien.

- La nota debe reflejar objetivamente la calidad del perfil — un perfil con buena experiencia, premios y publicaciones NO debe tener nota baja.

- VARIABILIDAD DE SCORES: Los scores de dimensiones y secciones DEBEN variar entre sí — no pueden ser todos iguales ni muy próximos. Secciones más débiles deben puntuar claramente menos que secciones fuertes.

- El campo "dimensoes" DEBE contener objetos con "score" (entero 1-10) y "analise" (texto explicativo de 2-3 frases) para cada dimensión, evaluados independientemente.

- El campo "scores_seccao" DEBE contener scores independientes para cada sección del perfil LinkedIn (headline, about, experience, skills, education, certifications, recommendations, network), cada uno con "score" (entero 1-10) y "analise" (2-3 frases específicas).

- El campo "benchmarking" DEBE posicionar el perfil frente al sector, con "percentil_estimado" como entero 1-100 (donde 1=bottom, 100=top), brechas concretas vs top performers, y ventajas competitivas.

- El campo "seo_linkedin" DEBE contener keywords primarias, secundarias, ausentes, por sección, y recomendaciones SEO específicas.

- Todo el análisis debe aportar valor real al profesional — algo que justifique la inversión.

- NUNCA hagas comentarios genéricos que podrían aplicarse a cualquier perfil. Cada frase debe ser específica de este profesional.`;


        const roastPrompt = `${roastOutputLanguageInstruction}\n\n${isEN ? roastPromptEN : isES ? roastPromptES : roastPromptPT}`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const geminiResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: roastPrompt

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 1,

              maxOutputTokens: 16384,

              responseMimeType: 'application/json',

              thinkingConfig: { thinkingLevel: 'low' }

            }

          })

        });

        if (!geminiResponse.ok) {

          const errorText = await geminiResponse.text();

          console.error('❌ Erro Gemini LinkedIn Audit:', errorText);

          return jsonResponse({

            success: false,

            error: 'Erro ao analisar perfil LinkedIn',

            details: errorText.substring(0, 200)

          }, 500);

        }

        const geminiData = await geminiResponse.json();

        let roastText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

        console.log('📝 Raw Gemini output length:', roastText.length, 'first 200:', roastText.substring(0, 200));

        // Clean markdown wrappers

        roastText = roastText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // Find the outermost JSON object using balanced brace matching

        function extractJSON(text) {

          const start = text.indexOf('{');

          if (start === -1) return text;

          let depth = 0;

          let inString = false;

          let escape = false;

          for(let i = start; i < text.length; i++){

            const ch = text[i];

            if (escape) {

              escape = false;

              continue;

            }

            if (ch === '\\') {

              escape = true;

              continue;

            }

            if (ch === '"') {

              inString = !inString;

              continue;

            }

            if (inString) continue;

            if (ch === '{') depth++;

            else if (ch === '}') {

              depth--;

              if (depth === 0) return text.substring(start, i + 1);

            }

          }

          // If unbalanced, take from start to last }

          const lastBrace = text.lastIndexOf('}');

          return lastBrace > start ? text.substring(start, lastBrace + 1) : text.substring(start);

        }

        roastText = extractJSON(roastText);

        // Clean trailing commas

        roastText = roastText.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');

        // Remove control characters except newlines

        roastText = roastText.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

        let roastAnalysis;

        try {

          roastAnalysis = JSON.parse(roastText);

          console.log('✅ LinkedIn Audit JSON parsed OK');

        } catch (parseErr) {

          console.error('⚠️ LinkedIn Audit JSON parse failed:', parseErr.message, 'text around error:', roastText.substring(0, 500));

          // Attempt 2: Try to fix common issues

          try {

            // Fix unescaped newlines inside strings

            roastText = roastText.replace(/(["'])\s*\n\s*/g, '$1 ');

            // Fix single quotes used as string delimiters

            roastText = roastText.replace(/(?<=[:,\[])\s*'/g, ' "').replace(/'\s*(?=[,\]\}])/g, '"');

            roastAnalysis = JSON.parse(roastText);

            console.log('✅ LinkedIn Audit JSON repaired (attempt 2)');

          } catch (repairErr2) {

            // Attempt 3: Use Gemini to fix the JSON

            try {

              console.log('⚠️ Attempting Gemini JSON repair...');

              const repairResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`, {

                method: 'POST',

                headers: {

                  'Content-Type': 'application/json'

                },

                body: JSON.stringify({

                  contents: [

                    {

                      role: 'user',

                      parts: [

                        {

                          text: `${roastJsonRepairInstruction} Fix this broken JSON and return ONLY valid JSON. Do not add any text before or after the JSON:\n\n${roastText.substring(0, 10000)}`

                        }

                      ]

                    }

                  ],

                  generationConfig: {

                    temperature: 0,

                    maxOutputTokens: 8000,

                    responseMimeType: 'application/json'

                  }

                })

              });

              if (repairResponse.ok) {

                const repairData = await repairResponse.json();

                const repairedText = repairData.candidates?.[0]?.content?.parts?.[0]?.text || '';

                roastAnalysis = JSON.parse(repairedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());

                console.log('✅ LinkedIn Audit JSON repaired via Gemini');

              } else {

                throw new Error('Gemini repair failed');

              }

            } catch (repairErr3) {

              console.error('❌ All JSON repair attempts failed');

              roastAnalysis = isEN ? {

                teaser: {

                  nota_geral: '5/10',

                  hook_vendas: 'Your profile has untapped potential. Find out how to improve it.'

                },

                analise_completa: {

                  sumario_executivo: 'Could not generate the full analysis. Please try again.',

                  visibilidade_algoritmo: 'Medium',

                  pontos_fortes: [

                    'Please try again later'

                  ],

                  areas_melhoria: [

                    {

                      area: 'General',

                      diagnostico: 'Analysis error',

                      recomendacao: 'Please try again.'

                    }

                  ],

                  headlines_sugeridas: [

                    'N/A'

                  ],

                  dicas_seo: [

                    'N/A'

                  ],

                  analise_formacao: 'N/A',

                  analise_rede: 'N/A',

                  recomendacao_prioritaria: 'Please try again.'

                }

              } : isES ? {

                teaser: {

                  nota_geral: '5/10',

                  hook_vendas: 'Tu perfil tiene potencial por explotar. Descubre cómo mejorarlo.'

                },

                analise_completa: {

                  sumario_executivo: 'No fue posible generar el análisis completo. Inténtalo de nuevo.',

                  visibilidade_algoritmo: 'Media',

                  pontos_fortes: [

                    'Inténtalo de nuevo más tarde'

                  ],

                  areas_melhoria: [

                    {

                      area: 'General',

                      diagnostico: 'Error en el análisis',

                      recomendacao: 'Inténtalo de nuevo.'

                    }

                  ],

                  headlines_sugeridas: [

                    'N/A'

                  ],

                  dicas_seo: [

                    'N/A'

                  ],

                  analise_formacao: 'N/A',

                  analise_rede: 'N/A',

                  recomendacao_prioritaria: 'Inténtalo de nuevo.'

                }

              } : {

                teaser: {

                  nota_geral: '5/10',

                  hook_vendas: 'O teu perfil tem potencial por explorar. Descobre como melhorá-lo.'

                },

                analise_completa: {

                  sumario_executivo: 'Não foi possível gerar a análise completa. Tenta novamente.',

                  visibilidade_algoritmo: 'Média',

                  pontos_fortes: [

                    'Tenta novamente mais tarde'

                  ],

                  areas_melhoria: [

                    {

                      area: 'Geral',

                      diagnostico: 'Erro na análise',

                      recomendacao: 'Tenta novamente.'

                    }

                  ],

                  headlines_sugeridas: [

                    'N/A'

                  ],

                  dicas_seo: [

                    'N/A'

                  ],

                  analise_formacao: 'N/A',

                  analise_rede: 'N/A',

                  recomendacao_prioritaria: 'Tenta novamente.'

                }

              };

            }

          }

        }

        console.log('✅ LinkedIn Audit gerado:', JSON.stringify(roastAnalysis).substring(0, 300));

        return jsonResponse({

          success: true,

          analysis_type: 'linkedin_roast',

          language,

          linkedin_roast: roastAnalysis,

          ...roastAnalysis

        });

      } catch (error) {

        console.error('❌ Erro no modo linkedin_roast:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao gerar auditoria LinkedIn',

          message: error.message

        }, 500);

      }

    }

    // ═══════════════════════════════════════════════════════════════

    //  MODE: AUTO EMAILS — Automated upsell/follow-up emails

    //  Called by Supabase cron job every hour

    // ═══════════════════════════════════════════════════════════════

    if (mode === 'auto_emails') {

      console.log('📧 Modo: Auto Emails — Verificando leads para upsell/follow-up');

      const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

      if (!BREVO_API_KEY) {

        console.error('❌ BREVO_API_KEY não configurada');

        return jsonResponse({

          success: false,

          error: 'BREVO_API_KEY não configurada'

        }, 500);

      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://cvlumvgrbuolrnwrtrgz.supabase.co';

      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY') || '';

      const supabase = createClient(supabaseUrl, supabaseKey);

      const SENDER = {

        name: 'Share2Inspire',

        email: 'srshare2inspire@gmail.com'

      };

      const results = {

        upsell_2h_sent: 0,

        followup_7d_sent: 0,

        crosssell_cv_to_cp_sent: 0,

        crosssell_cp_to_pro_sent: 0,

        errors: 0,

        skipped: 0

      };

      try {

        // Get all emails that already received auto emails

        const { data: sentEmails } = await supabase.from('email_history').select('recipient_email, email_type').in('email_type', [

          'upsell_auto_2h',

          'upsell_auto_7d',

          'crosssell_cv_to_cp',

          'crosssell_cp_to_pro'

        ]);

        const sent2h = new Set((sentEmails || []).filter((e)=>e.email_type === 'upsell_auto_2h').map((e)=>e.recipient_email));

        const sent7d = new Set((sentEmails || []).filter((e)=>e.email_type === 'upsell_auto_7d').map((e)=>e.recipient_email));

        const sentCvToCp = new Set((sentEmails || []).filter((e)=>e.email_type === 'crosssell_cv_to_cp').map((e)=>e.recipient_email));

        const sentCpToPro = new Set((sentEmails || []).filter((e)=>e.email_type === 'crosssell_cp_to_pro').map((e)=>e.recipient_email));

        // Get all emails that have paid (already converted — skip them)

        const { data: paidUsers } = await supabase.from('cv_analysis').select('user_email').eq('payment_status', 'paid');

        const convertedEmails = new Set((paidUsers || []).map((u)=>u.user_email));

        // ── UPSELL 2H: Free analyses created > 2 hours ago ──

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data: leads2h } = await supabase.from('cv_analysis').select('user_email, user_name, score, domain, created_at').in('analysis_type', [

          'free',

          'free_heuristic'

        ]).eq('payment_status', 'pending').lt('created_at', twoHoursAgo).gt('created_at', twentyFourHoursAgo).order('created_at', {

          ascending: false

        });

        // Deduplicate by email

        const unique2h = new Map();

        for (const lead of leads2h || []){

          if (!unique2h.has(lead.user_email)) unique2h.set(lead.user_email, lead);

        }

        for (const [email, lead] of unique2h){

          if (sent2h.has(email) || convertedEmails.has(email)) {

            results.skipped++;

            continue;

          }

          const isEN = lead.domain && lead.domain.includes('/en');

          const isES = lead.domain && lead.domain.includes('/es');

          const firstName = (lead.user_name || '').split(' ')[0] || 'there';

          const score = lead.score || 75;

          const subjectPT = `${firstName}, o teu CV tem ${score}/100 — vê o relatório completo`;

          const subjectEN = `${firstName}, your CV scored ${score}/100 — see the full report`;

          const subjectES = `${firstName}, tu CV obtuvo ${score}/100 — mira el informe completo`;

          const htmlPT = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Olá ${firstName} 👋</h2>

            <p>Fizeste a análise gratuita do teu CV e obtiveste <strong>${score}/100</strong>.</p>

            <p>O relatório completo inclui:</p>

            <ul>

              <li>✅ Análise detalhada de cada secção do CV</li>

              <li>✅ Sugestões de reescrita prontas a usar</li>

              <li>✅ Pontuação ATS e compatibilidade</li>

              <li>✅ Benchmarking com a tua área profissional</li>

            </ul>

            <p style="margin:25px 0"><a href="https://www.share2inspire.pt/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Ver Relatório Completo — 4,99€</a></p>

            <p style="color:#888;font-size:13px">Pagamento único. Sem subscrição. Resultado em 30 segundos.</p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const htmlEN = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Hi ${firstName} 👋</h2>

            <p>You ran a free analysis of your CV and scored <strong>${score}/100</strong>.</p>

            <p>The full report includes:</p>

            <ul>

              <li>✅ Detailed analysis of each CV section</li>

              <li>✅ Ready-to-use rewrite suggestions</li>

              <li>✅ ATS score and compatibility check</li>

              <li>✅ Benchmarking against your professional area</li>

            </ul>

            <p style="margin:25px 0"><a href="https://www.share2inspire.pt/en/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">See Full Report — $4.99</a></p>

            <p style="color:#888;font-size:13px">One-time payment. No subscription. Results in 30 seconds.</p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt/en" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const htmlES = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Hola ${firstName} 👋</h2>

            <p>Realizaste el análisis gratuito de tu CV y obtuviste <strong>${score}/100</strong>.</p>

            <p>El informe completo incluye:</p>

            <ul>

              <li>✅ Análisis detallado de cada sección del CV</li>

              <li>✅ Sugerencias de reescritura listas para usar</li>

              <li>✅ Puntuación ATS y compatibilidad</li>

              <li>✅ Comparación con tu área profesional</li>

            </ul>

            <p style="margin:25px 0"><a href="https://www.share2inspire.pt/es/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Ver Informe Completo — 4,99€</a></p>

            <p style="color:#888;font-size:13px">Pago único. Sin suscripción. Resultado en 30 segundos.</p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt/es" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const subject = isEN ? subjectEN : isES ? subjectES : subjectPT;

          const html = isEN ? htmlEN : isES ? htmlES : htmlPT;

          try {

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {

              method: 'POST',

              headers: {

                'api-key': BREVO_API_KEY,

                'Content-Type': 'application/json'

              },

              body: JSON.stringify({

                sender: SENDER,

                to: [

                  {

                    email,

                    name: lead.user_name || ''

                  }

                ],

                subject,

                htmlContent: html

              })

            });

            if (res.ok) {

              await supabase.from('email_history').insert({

                recipient_email: email,

                recipient_name: lead.user_name || '',

                subject,

                campaign_type: 'auto_upsell',

                email_type: 'upsell_auto_2h',

                status: 'sent'

              });

              results.upsell_2h_sent++;

              console.log(`✅ Upsell 2h enviado para ${email}`);

            } else {

              const err = await res.text();

              console.error(`❌ Erro Brevo para ${email}:`, err);

              results.errors++;

            }

          } catch (e) {

            console.error(`❌ Erro ao enviar para ${email}:`, e.message);

            results.errors++;

          }

          // Rate limit: wait 200ms between emails

          await new Promise((r)=>setTimeout(r, 200));

        }

        // ── FOLLOW-UP 7D: Free analyses created > 7 days ago ──

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: leads7d } = await supabase.from('cv_analysis').select('user_email, user_name, score, domain, created_at').in('analysis_type', [

          'free',

          'free_heuristic'

        ]).eq('payment_status', 'pending').lt('created_at', sevenDaysAgo).gt('created_at', thirtyDaysAgo).order('created_at', {

          ascending: false

        });

        const unique7d = new Map();

        for (const lead of leads7d || []){

          if (!unique7d.has(lead.user_email)) unique7d.set(lead.user_email, lead);

        }

        for (const [email, lead] of unique7d){

          if (sent7d.has(email) || convertedEmails.has(email)) {

            results.skipped++;

            continue;

          }

          const isEN = lead.domain && lead.domain.includes('/en');

          const isES = lead.domain && lead.domain.includes('/es');

          const firstName = (lead.user_name || '').split(' ')[0] || 'there';

          const subjectPT = `${firstName}, ainda podes melhorar o teu CV — oferta especial`;

          const subjectEN = `${firstName}, you can still improve your CV — special offer`;

          const subjectES = `${firstName}, aún puedes mejorar tu CV — oferta especial`;

          const htmlPT = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Olá ${firstName} 👋</h2>

            <p>Há uma semana fizeste a análise gratuita do teu CV. Já tiveste oportunidade de melhorar os pontos identificados?</p>

            <p>Com o <strong>relatório completo</strong>, recebes:</p>

            <ul>

              <li>📋 Reescritas profissionais prontas a copiar</li>

              <li>🎯 Análise ATS detalhada</li>

              <li>📊 Comparação com profissionais da tua área</li>

            </ul>

            <p>E se quiseres ir mais longe, o <strong>Career Path</strong> mostra-te as 3 melhores funções para o teu perfil, com roadmap e salário estimado.</p>

            <p style="margin:25px 0">

              <a href="https://www.share2inspire.pt/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Relatório CV — 4,99€</a>

              &nbsp;&nbsp;

              <a href="https://www.share2inspire.pt/career-path" style="background:#333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Career Path — 10€</a>

            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const htmlEN = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Hi ${firstName} 👋</h2>

            <p>A week ago you ran a free analysis of your CV. Have you had a chance to improve the areas we identified?</p>

            <p>With the <strong>full report</strong>, you get:</p>

            <ul>

              <li>📋 Professional rewrites ready to copy</li>

              <li>🎯 Detailed ATS analysis</li>

              <li>📊 Comparison with professionals in your field</li>

            </ul>

            <p>And if you want to go further, the <strong>Career Path</strong> shows you the 3 best roles for your profile, with a roadmap and estimated salary.</p>

            <p style="margin:25px 0">

              <a href="https://www.share2inspire.pt/en/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">CV Report — $4.99</a>

              &nbsp;&nbsp;

              <a href="https://www.share2inspire.pt/en/career-path" style="background:#333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Career Path — $12.50</a>

            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt/en" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const htmlES = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">

            <img src="https://www.share2inspire.pt/img/logo.webp" alt="Share2Inspire" style="height:40px;margin-bottom:20px">

            <h2 style="color:#333">Hola ${firstName} 👋</h2>

            <p>Hace una semana realizaste el análisis gratuito de tu CV. ¿Ya tuviste oportunidad de mejorar los puntos identificados?</p>

            <p>Con el <strong>informe completo</strong>, recibes:</p>

            <ul>

              <li>📋 Reescrituras profesionales listas para copiar</li>

              <li>🎯 Análisis ATS detallado</li>

              <li>📊 Comparación con profesionales de tu área</li>

            </ul>

            <p>Y si quieres ir más lejos, el <strong>Career Path</strong> te muestra los 3 mejores roles para tu perfil, con hoja de ruta y salario estimado.</p>

            <p style="margin:25px 0">

              <a href="https://www.share2inspire.pt/es/cv-analyser" style="background:#c8a45a;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Informe CV — 4,99€</a>

              &nbsp;&nbsp;

              <a href="https://www.share2inspire.pt/es/career-path" style="background:#333;color:#fff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block">Career Path — 10€</a>

            </p>

            <hr style="border:none;border-top:1px solid #eee;margin:30px 0">

            <p style="color:#999;font-size:12px">Share2Inspire · <a href="https://www.share2inspire.pt/es" style="color:#c8a45a">share2inspire.pt</a></p>

          </div>`;

          const subject = isEN ? subjectEN : isES ? subjectES : subjectPT;

          const html = isEN ? htmlEN : isES ? htmlES : htmlPT;

          try {

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {

              method: 'POST',

              headers: {

                'api-key': BREVO_API_KEY,

                'Content-Type': 'application/json'

              },

              body: JSON.stringify({

                sender: SENDER,

                to: [

                  {

                    email,

                    name: lead.user_name || ''

                  }

                ],

                subject,

                htmlContent: html

              })

            });

            if (res.ok) {

              await supabase.from('email_history').insert({

                recipient_email: email,

                recipient_name: lead.user_name || '',

                subject,

                campaign_type: 'auto_followup',

                email_type: 'upsell_auto_7d',

                status: 'sent'

              });

              results.followup_7d_sent++;

              console.log(`✅ Follow-up 7d enviado para ${email}`);

            } else {

              const err = await res.text();

              console.error(`❌ Erro Brevo para ${email}:`, err);

              results.errors++;

            }

          } catch (e) {

            console.error(`❌ Erro ao enviar para ${email}:`, e.message);

            results.errors++;

          }

          await new Promise((r)=>setTimeout(r, 200));

        }

        // ── CROSS-SELL: CV Analyser paid → Career Path with 50% discount (CVPATH50) ──

        const twoHoursAgoCS = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        const { data: cvPaidLeads } = await supabase.from('cv_analysis').select('user_email, user_name, domain, created_at').eq('analysis_type', 'paid').eq('payment_status', 'paid').lt('created_at', twoHoursAgoCS).order('created_at', {

          ascending: false

        });

        // Get users who already bought career_path (skip them)

        const { data: cpPaidUsers } = await supabase.from('cv_analysis').select('user_email').eq('analysis_type', 'career_path').eq('payment_status', 'paid');

        const cpConvertedEmails = new Set((cpPaidUsers || []).map((u)=>u.user_email));

        const uniqueCvPaid = new Map();

        for (const lead of cvPaidLeads || []){

          if (!uniqueCvPaid.has(lead.user_email)) uniqueCvPaid.set(lead.user_email, lead);

        }

        for (const [email, lead] of uniqueCvPaid){

          if (sentCvToCp.has(email) || cpConvertedEmails.has(email)) {

            results.skipped++;

            continue;

          }

          const isEN = lead.domain && lead.domain.includes('/en');

          const isES = lead.domain && lead.domain.includes('/es');

          const firstName = (lead.user_name || '').split(' ')[0] || (isEN ? 'there' : isES ? 'profesional' : 'profissional');

          const subjectPT = `${firstName}, descobre o teu Career Path com 50% de desconto`;

          const subjectEN = `${firstName}, discover your Career Path with 50% off`;

          const subjectES = `${firstName}, descubre tu Career Path con 50% de descuento`;

          const htmlPT = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Olá ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">Já tens a tua análise de CV completa. Agora é altura de dar o próximo passo: descobrir as <strong>3 melhores funções</strong> para o teu perfil com o <strong style="color:#C9A961">Career Path</strong>.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">O que vais receber:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>3 caminhos de carreira personalizados para o teu perfil</li>

    <li>Roadmap detalhado com competências a desenvolver</li>

    <li>Estimativa salarial para cada função</li>

    <li>Empresas que estão a contratar na tua área</li>

  </ul>

  <div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0">

    <p style="margin:0;font-size:15px;color:#333"><strong>Oferta exclusiva:</strong> Usa o código <strong style="color:#C9A961;font-size:18px">CVPATH50</strong> e obtém <strong>50% de desconto</strong> no Career Path.</p>

  </div>

  <p style="text-align:center;margin:28px 0"><a href="https://www.share2inspire.pt/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Descobrir o meu Career Path</a></p>

  <p style="color:#888;font-size:13px;text-align:center">Pagamento único. Resultado em 60 segundos.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">Recebeste este email porque utilizaste o Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. Todos os direitos reservados.</p>

</div>

</div>`;

          const htmlEN = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Hi ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">You already have your full CV analysis. Now it's time to take the next step: discover the <strong>3 best roles</strong> for your profile with <strong style="color:#C9A961">Career Path</strong>.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">What you'll get:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>3 personalised career paths for your profile</li>

    <li>Detailed roadmap with skills to develop</li>

    <li>Salary estimate for each role</li>

    <li>Companies hiring in your area</li>

  </ul>

  <div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0">

    <p style="margin:0;font-size:15px;color:#333"><strong>Exclusive offer:</strong> Use code <strong style="color:#C9A961;font-size:18px">CVPATH50</strong> for <strong>50% off</strong> Career Path.</p>

  </div>

  <p style="text-align:center;margin:28px 0"><a href="https://www.share2inspire.pt/en/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Discover my Career Path</a></p>

  <p style="color:#888;font-size:13px;text-align:center">One-time payment. Results in 60 seconds.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">You received this email because you used Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. All rights reserved.</p>

</div>

</div>`;

          const htmlES = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Hola ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">Ya tienes tu análisis de CV completo. Ahora es momento de dar el siguiente paso: descubrir los <strong>3 mejores roles</strong> para tu perfil con <strong style="color:#C9A961">Career Path</strong>.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">Lo que recibirás:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>3 caminos de carrera personalizados para tu perfil</li>

    <li>Hoja de ruta detallada con competencias a desarrollar</li>

    <li>Estimación salarial para cada rol</li>

    <li>Empresas que están contratando en tu área</li>

  </ul>

  <div style="background:#f8f6f0;border-left:4px solid #C9A961;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0">

    <p style="margin:0;font-size:15px;color:#333"><strong>Oferta exclusiva:</strong> Usa el código <strong style="color:#C9A961;font-size:18px">CVPATH50</strong> y obtén <strong>50% de descuento</strong> en Career Path.</p>

  </div>

  <p style="text-align:center;margin:28px 0"><a href="https://www.share2inspire.pt/es/career-path" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Descubrir mi Career Path</a></p>

  <p style="color:#888;font-size:13px;text-align:center">Pago único. Resultado en 60 segundos.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">Recibiste este correo porque utilizaste Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. Todos los derechos reservados.</p>

</div>

</div>`;

          const subject = isEN ? subjectEN : isES ? subjectES : subjectPT;

          const html = isEN ? htmlEN : isES ? htmlES : htmlPT;

          try {

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {

              method: 'POST',

              headers: {

                'api-key': BREVO_API_KEY,

                'Content-Type': 'application/json'

              },

              body: JSON.stringify({

                sender: SENDER,

                to: [

                  {

                    email,

                    name: lead.user_name || ''

                  }

                ],

                subject,

                htmlContent: html

              })

            });

            if (res.ok) {

              await supabase.from('email_history').insert({

                recipient_email: email,

                recipient_name: lead.user_name || '',

                subject,

                campaign_type: 'crosssell_cv_to_cp',

                email_type: 'crosssell_cv_to_cp',

                status: 'sent'

              });

              results.crosssell_cv_to_cp_sent++;

              console.log(`✅ Cross-sell CV→CP enviado para ${email}`);

            } else {

              const err = await res.text();

              console.error(`❌ Erro Brevo CV→CP para ${email}:`, err);

              results.errors++;

            }

          } catch (e) {

            console.error(`❌ Erro ao enviar CV→CP para ${email}:`, e.message);

            results.errors++;

          }

          await new Promise((r)=>setTimeout(r, 200));

        }

        // ── CROSS-SELL: Career Path paid → Pro subscription 1 month free (PATHPRO) ──

        const { data: cpPaidLeads } = await supabase.from('cv_analysis').select('user_email, user_name, domain, created_at').eq('analysis_type', 'career_path').eq('payment_status', 'paid').lt('created_at', twoHoursAgoCS).order('created_at', {

          ascending: false

        });

        // Get users who already have an active subscription (skip them)

        const { data: activeSubscribers } = await supabase.from('subscriptions').select('user_email').eq('status', 'active');

        const subscriberEmails = new Set((activeSubscribers || []).map((u)=>u.user_email));

        const uniqueCpPaid = new Map();

        for (const lead of cpPaidLeads || []){

          if (!uniqueCpPaid.has(lead.user_email)) uniqueCpPaid.set(lead.user_email, lead);

        }

        for (const [email, lead] of uniqueCpPaid){

          if (sentCpToPro.has(email) || subscriberEmails.has(email)) {

            results.skipped++;

            continue;

          }

          const isEN = lead.domain && lead.domain.includes('/en');

          const isES = lead.domain && lead.domain.includes('/es');

          const firstName = (lead.user_name || '').split(' ')[0] || (isEN ? 'there' : isES ? 'profesional' : 'profissional');

          const subjectPT = `${firstName}, 1 mês grátis de subscrição Pro — exclusivo para ti`;

          const subjectEN = `${firstName}, 1 free month of Pro subscription — exclusive for you`;

          const subjectES = `${firstName}, 1 mes gratis de suscripción Pro — exclusivo para ti`;

          const htmlPT = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Olá ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">Parabéns pelo teu Career Path! Agora que já sabes quais são as melhores funções para o teu perfil, queremos oferecer-te acesso completo à plataforma.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">Com a <strong style="color:#C9A961">subscrição Pro</strong>, tens acesso a:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>Análises ilimitadas de CV</li>

    <li>Career Path e Career Intelligence incluídos</li>

    <li>LinkedIn Roaster ilimitado</li>

    <li>Acesso prioritário a novas funcionalidades</li>

    <li>75% de desconto em todos os serviços avulso</li>

  </ul>

  <div style="background:linear-gradient(135deg,#0a1628,#162a4a);border-radius:12px;padding:24px;margin:24px 0;text-align:center">

    <p style="margin:0 0 8px;font-size:13px;color:#C9A961;text-transform:uppercase;letter-spacing:2px;font-weight:600">Oferta exclusiva</p>

    <p style="margin:0 0 4px;font-size:28px;color:#fff;font-weight:700">1 Mês GRÁTIS</p>

    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.7)">Subscrição Pro — sem compromisso</p>

    <p style="margin:0;font-size:15px;color:#fff">Código: <strong style="color:#C9A961;font-size:20px;letter-spacing:2px">PATHPRO</strong></p>

  </div>

  <p style="text-align:center;margin:28px 0">

    <a href="https://www.share2inspire.pt/area-cliente" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Registar e ativar Pro grátis</a>

  </p>

  <p style="color:#888;font-size:13px;text-align:center">Regista-te na área de cliente e usa o código <strong>PATHPRO</strong> ao subscrever.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">Recebeste este email porque utilizaste o Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. Todos os direitos reservados.</p>

</div>

</div>`;

          const htmlEN = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Hi ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">Congratulations on your Career Path! Now that you know the best roles for your profile, we want to give you full access to the platform.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">With a <strong style="color:#C9A961">Pro subscription</strong>, you get:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>Unlimited CV analyses</li>

    <li>Career Path and Career Intelligence included</li>

    <li>Unlimited LinkedIn Roaster</li>

    <li>Priority access to new features</li>

    <li>75% off all standalone services</li>

  </ul>

  <div style="background:linear-gradient(135deg,#0a1628,#162a4a);border-radius:12px;padding:24px;margin:24px 0;text-align:center">

    <p style="margin:0 0 8px;font-size:13px;color:#C9A961;text-transform:uppercase;letter-spacing:2px;font-weight:600">Exclusive offer</p>

    <p style="margin:0 0 4px;font-size:28px;color:#fff;font-weight:700">1 Month FREE</p>

    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.7)">Pro subscription — no commitment</p>

    <p style="margin:0;font-size:15px;color:#fff">Code: <strong style="color:#C9A961;font-size:20px;letter-spacing:2px">PATHPRO</strong></p>

  </div>

  <p style="text-align:center;margin:28px 0">

    <a href="https://www.share2inspire.pt/area-cliente" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Register and activate free Pro</a>

  </p>

  <p style="color:#888;font-size:13px;text-align:center">Register in the client area and use code <strong>PATHPRO</strong> when subscribing.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">You received this email because you used Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. All rights reserved.</p>

</div>

</div>`;

          const htmlES = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto">

<div style="background:linear-gradient(135deg,#0a1628 0%,#162a4a 100%);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center">

  <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" height="40" style="height:40px;margin-bottom:8px">

  <div style="font-size:10px;color:#C9A961;letter-spacing:3px;text-transform:uppercase;font-weight:600">Career Intelligence Platform</div>

</div>

<div style="height:3px;background:linear-gradient(90deg,#C9A961,#e8d5a3,#C9A961)"></div>

<div style="background:#fff;padding:32px">

  <h2 style="color:#1a1a2e;font-size:22px;margin-bottom:16px">Hola ${firstName},</h2>

  <p style="color:#555;font-size:15px;line-height:1.7">¡Felicidades por tu Career Path! Ahora que ya sabes cuáles son los mejores roles para tu perfil, queremos ofrecerte acceso completo a la plataforma.</p>

  <p style="color:#555;font-size:15px;line-height:1.7">Con la <strong style="color:#C9A961">suscripción Pro</strong>, tienes acceso a:</p>

  <ul style="color:#555;font-size:14px;line-height:2">

    <li>Análisis ilimitados de CV</li>

    <li>Career Path y Career Intelligence incluidos</li>

    <li>LinkedIn Roaster ilimitado</li>

    <li>Acceso prioritario a nuevas funcionalidades</li>

    <li>75% de descuento en todos los servicios individuales</li>

  </ul>

  <div style="background:linear-gradient(135deg,#0a1628,#162a4a);border-radius:12px;padding:24px;margin:24px 0;text-align:center">

    <p style="margin:0 0 8px;font-size:13px;color:#C9A961;text-transform:uppercase;letter-spacing:2px;font-weight:600">Oferta exclusiva</p>

    <p style="margin:0 0 4px;font-size:28px;color:#fff;font-weight:700">1 Mes GRATIS</p>

    <p style="margin:0 0 16px;font-size:14px;color:rgba(255,255,255,0.7)">Suscripción Pro — sin compromiso</p>

    <p style="margin:0;font-size:15px;color:#fff">Código: <strong style="color:#C9A961;font-size:20px;letter-spacing:2px">PATHPRO</strong></p>

  </div>

  <p style="text-align:center;margin:28px 0">

    <a href="https://www.share2inspire.pt/es/area-cliente" style="display:inline-block;background:#C9A961;color:#0a1628;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Registrarse y activar Pro gratis</a>

  </p>

  <p style="color:#888;font-size:13px;text-align:center">Regístrate en el área de cliente y usa el código <strong>PATHPRO</strong> al suscribirte.</p>

</div>

<div style="background:#0a1628;padding:20px 32px;border-radius:0 0 12px 12px;text-align:center">

  <p style="margin:0 0 8px;font-size:11px;color:rgba(255,255,255,0.4)">Recibiste este correo porque utilizaste Share2Inspire.</p>

  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3)">&copy; 2026 Share2Inspire. Todos los derechos reservados.</p>

</div>

</div>`;

          const subject = isEN ? subjectEN : isES ? subjectES : subjectPT;

          const html = isEN ? htmlEN : isES ? htmlES : htmlPT;

          try {

            const res = await fetch('https://api.brevo.com/v3/smtp/email', {

              method: 'POST',

              headers: {

                'api-key': BREVO_API_KEY,

                'Content-Type': 'application/json'

              },

              body: JSON.stringify({

                sender: SENDER,

                to: [

                  {

                    email,

                    name: lead.user_name || ''

                  }

                ],

                subject,

                htmlContent: html

              })

            });

            if (res.ok) {

              await supabase.from('email_history').insert({

                recipient_email: email,

                recipient_name: lead.user_name || '',

                subject,

                campaign_type: 'crosssell_cp_to_pro',

                email_type: 'crosssell_cp_to_pro',

                status: 'sent'

              });

              results.crosssell_cp_to_pro_sent++;

              console.log(`✅ Cross-sell CP→Pro enviado para ${email}`);

            } else {

              const err = await res.text();

              console.error(`❌ Erro Brevo CP→Pro para ${email}:`, err);

              results.errors++;

            }

          } catch (e) {

            console.error(`❌ Erro ao enviar CP→Pro para ${email}:`, e.message);

            results.errors++;

          }

          await new Promise((r)=>setTimeout(r, 200));

        }

        console.log('📧 Auto emails concluído:', JSON.stringify(results));

        return jsonResponse({

          success: true,

          ...results

        });

      } catch (error) {

        console.error('❌ Erro no modo auto_emails:', error);

        return jsonResponse({

          success: false,

          error: 'Erro na automação de emails',

          message: error.message

        }, 500);

      }

    }

    // ═══════════════════════════════════════════════════════════════

    //  MODE: SEND ANALYSIS EMAIL — Send analysis results to user via Brevo

    //  Called from the frontend "Send by email" button

    // ═══════════════════════════════════════════════════════════════

    if (mode === 'send_analysis_email') {

      console.log('📧 Modo: Send Analysis Email');

      const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');

      if (!BREVO_API_KEY) {

        console.error('❌ BREVO_API_KEY não configurada');

        return jsonResponse({

          success: false,

          error: 'BREVO_API_KEY não configurada'

        }, 500);

      }

      const recipientEmail = body.recipient_email;

      const recipientName = body.recipient_name || '';

      const analysisType = body.analysis_type || 'cv_analysis'; // cv_analysis, career_path, career_intelligence, linkedin_roast

      const analysisHtml = body.analysis_html || '';

      const analysisSubject = body.subject || '';

      const isEN = body.language === 'en';
      const isES = body.language === 'es';

      if (!recipientEmail) {

        return jsonResponse({

          success: false,

          error: 'recipient_email é obrigatório'

        }, 400);

      }

      if (!analysisHtml) {

        return jsonResponse({

          success: false,

          error: 'analysis_html é obrigatório'

        }, 400);

      }

      const SENDER = {

        name: 'Share2Inspire',

        email: 'srshare2inspire@gmail.com'

      };

      const typeLabels = {

        cv_analysis: {

          pt: 'Análise de CV',

          en: 'CV Analysis',

          es: 'Análisis de CV'

        },

        career_path: {

          pt: 'Career Path',

          en: 'Career Path',

          es: 'Career Path'

        },

        career_intelligence: {

          pt: 'Career Intelligence',

          en: 'Career Intelligence',

          es: 'Career Intelligence'

        },

        linkedin_roast: {

          pt: 'Auditoria LinkedIn',

          en: 'LinkedIn Audit',

          es: 'Auditoría de LinkedIn'

        }

      };

      const typeLabel = typeLabels[analysisType] || typeLabels.cv_analysis;

      const subject = analysisSubject || (isEN ? `Your ${typeLabel.en} Report — Share2Inspire` : isES ? `Tu Informe de ${typeLabel.es || typeLabel.en} — Share2Inspire` : `O teu Relatório de ${typeLabel.pt} — Share2Inspire`);

      const htmlContent = `

        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;padding:30px 20px;background:#fafaf8">

          <div style="text-align:center;margin-bottom:30px">

            <img src="https://www.share2inspire.pt/images/logo.webp" alt="Share2Inspire" style="height:40px" />

          </div>

          <div style="background:#fff;border-radius:12px;padding:30px;border:1px solid #e8e4dc">

            <h2 style="color:#1a1a1a;font-size:22px;margin:0 0 8px">${isEN ? typeLabel.en : isES ? (typeLabel.es || typeLabel.en) : typeLabel.pt}</h2>

            <p style="color:#666;font-size:14px;margin:0 0 24px">${isEN ? 'Here is your analysis report from Share2Inspire.' : isES ? 'Aquí tienes tu informe de análisis de Share2Inspire.' : 'Aqui está o teu relatório de análise da Share2Inspire.'}</p>

            <hr style="border:none;border-top:1px solid #e8e4dc;margin:0 0 24px">

            ${analysisHtml}

          </div>

          <div style="text-align:center;margin-top:30px;padding:20px">

            <p style="color:#999;font-size:12px;margin:0 0 8px">${isEN ? 'Want to explore more tools?' : isES ? '¿Quieres explorar más herramientas?' : 'Queres explorar mais ferramentas?'}</p>

            <a href="https://www.share2inspire.pt/area-cliente/membros" style="display:inline-block;background:#c8a45a;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600">${isEN ? 'Go to Member Area' : isES ? 'Ir al Área de Miembro' : 'Ir para Área de Membro'}</a>

          </div>

          <hr style="border:none;border-top:1px solid #eee;margin:30px 0 15px">

          <p style="color:#999;font-size:11px;text-align:center">Share2Inspire · <a href="https://www.share2inspire.pt" style="color:#c8a45a">share2inspire.pt</a></p>

        </div>`;

      try {

        const res = await fetch('https://api.brevo.com/v3/smtp/email', {

          method: 'POST',

          headers: {

            'api-key': BREVO_API_KEY,

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            sender: SENDER,

            to: [

              {

                email: recipientEmail,

                name: recipientName

              }

            ],

            subject,

            htmlContent

          })

        });

        if (res.ok) {

          console.log(`✅ Analysis email enviado para ${recipientEmail}`);

          return jsonResponse({

            success: true,

            message: 'Email enviado com sucesso'

          });

        } else {

          const err = await res.text();

          console.error(`❌ Erro Brevo:`, err);

          return jsonResponse({

            success: false,

            error: 'Erro ao enviar email',

            details: err.substring(0, 200)

          }, 500);

        }

      } catch (error) {

        console.error('❌ Erro ao enviar email:', error);

        return jsonResponse({

          success: false,

          error: 'Erro ao enviar email',

          message: error.message

        }, 500);

      }

    }

    // MODE: Mock Interview (Simulador de Entrevistas com Voz)

    if (mode === 'mock_interview') {

      console.log(`🎙️ Modo: Mock Interview [lang=${language || 'pt'}]`);

      const { audio_base64, mime_type, cv_text: interviewCvText, current_question, target_role } = body;

      const targetCompanyMI = body.target_company || '';

      const isPT = language === 'pt' || language === 'PT';

      const isESMI = language === 'es';

      if (!audio_base64) {

        return jsonResponse({

          success: false,

          error: isPT ? 'Áudio em base64 é obrigatório' : isESMI ? 'El audio en base64 es obligatorio' : 'Base64 audio is required'

        }, 400);

      }

      const audioMimeType = mime_type || 'audio/webm';

      try {

        // Gemini: Enrich mock interview with target company data

        let miCompanyContext = '';

        if (targetCompanyMI) {

          try {

            const miCompanyDetails = await fetchCompanyDetails(targetCompanyMI);

            if (miCompanyDetails) {

              miCompanyContext = isPT

                ? `\n\nDADOS DA EMPRESA-ALVO (verificados):\nEmpresa: ${miCompanyDetails.name}\n${miCompanyDetails.industry ? `Indústria: ${miCompanyDetails.industry}\n` : ''}${miCompanyDetails.employee_count ? `Dimensão: ${miCompanyDetails.employee_count.toLocaleString()} funcionários\n` : ''}${miCompanyDetails.specialties?.length ? `Especialidades: ${miCompanyDetails.specialties.join(', ')}\n` : ''}${miCompanyDetails.description ? `Descrição: ${miCompanyDetails.description.substring(0, 300)}\n` : ''}\nUSA estes dados para fazer perguntas contextuais sobre a empresa (ex: "Porque queres trabalhar nesta empresa de ${miCompanyDetails.industry}?", "Como a tua experiência se alinha com as especialidades da empresa em ${miCompanyDetails.specialties?.[0] || 'esta área'}?"). A improved_answer também deve referenciar dados reais da empresa.`

                : isESMI

                  ? `\n\nDATOS DE LA EMPRESA OBJETIVO (verificados):\nEmpresa: ${miCompanyDetails.name}\n${miCompanyDetails.industry ? `Industria: ${miCompanyDetails.industry}\n` : ''}${miCompanyDetails.employee_count ? `Tamaño: ${miCompanyDetails.employee_count.toLocaleString()} empleados\n` : ''}${miCompanyDetails.specialties?.length ? `Especialidades: ${miCompanyDetails.specialties.join(', ')}\n` : ''}${miCompanyDetails.description ? `Descripción: ${miCompanyDetails.description.substring(0, 300)}\n` : ''}\nUSA estos datos para hacer preguntas contextuales sobre la empresa (ej: "¿Por qué quieres trabajar en esta empresa de ${miCompanyDetails.industry}?", "¿Cómo tu experiencia se alinea con las especialidades de la empresa en ${miCompanyDetails.specialties?.[0] || 'esta área'}?"). La improved_answer también debe referenciar datos reales de la empresa.`

                  : `\n\nTARGET COMPANY DATA (verified):\nCompany: ${miCompanyDetails.name}\n${miCompanyDetails.industry ? `Industry: ${miCompanyDetails.industry}\n` : ''}${miCompanyDetails.employee_count ? `Size: ${miCompanyDetails.employee_count.toLocaleString()} employees\n` : ''}${miCompanyDetails.specialties?.length ? `Specialties: ${miCompanyDetails.specialties.join(', ')}\n` : ''}${miCompanyDetails.description ? `Description: ${miCompanyDetails.description.substring(0, 300)}\n` : ''}\nUSE this data to ask contextual questions about the company (e.g., "Why do you want to work at this ${miCompanyDetails.industry} company?", "How does your experience align with the company's focus on ${miCompanyDetails.specialties?.[0] || 'this area'}?"). The improved_answer should also reference real company data.`;

              console.log(`✅ Gemini: Mock interview enriched for ${miCompanyDetails.name}`);

            }

          } catch (e) {

            console.warn('Gemini mock interview enrichment failed:', e.message);

          }

        }

        const systemPrompt = isPT ? `És um Senior Executive Recruiter na Share2Inspire, a conduzir uma entrevista simulada.

Abaixo tens o CV do candidato e o cargo a que ele se candidata. A última pergunta que lhe fizeste foi: "${current_question || 'Fala-me um pouco sobre ti e a tua experiência.'}".



Vais ouvir o áudio com a resposta do candidato. Analisa o áudio DIRETAMENTE e avalia:

1. Conteúdo: Ele respondeu à pergunta? Usou o método STAR (Situação, Tarefa, Ação, Resultado) se aplicável? Foi vago ou específico?

2. Entrega e Tom: Estava nervoso? Fez muitas pausas ("hmm", "éhh")? O tom de voz transmitia confiança?

3. Duração: Respostas de entrevista ideais têm entre 1 e 2 minutos. Foi demasiado longa ou demasiado curta?

${miCompanyContext}



DEVOLVE APENAS UM JSON VÁLIDO COM A SEGUINTE ESTRUTURA:

{

  "transcription_summary": "O que tu entendeste da resposta dele (um resumo do que foi dito)",

  "duration_feedback": "Feedback sobre o tempo de resposta (curto, longo, ideal)",

  "delivery_and_tone": "Feedback brutalmente honesto sobre a voz, hesitações e confiança",

  "content_critique": "Crítica ao conteúdo (faltou o método STAR? Faltaram métricas? Se há dados da empresa-alvo, avalia se o candidato demonstrou conhecimento da empresa)",

  "improved_answer": "Como um candidato de topo teria respondido a esta mesma pergunta (escreve o guião ideal na 1ª pessoa, referenciando dados reais da empresa se disponíveis)",

  "next_question": "A próxima pergunta de entrevista a fazer, baseada na resposta que ele acabou de dar ou noutro ponto interessante do CV dele (se há dados da empresa, faz perguntas contextuais sobre a empresa)"

}



CV do Candidato:

${interviewCvText ? interviewCvText.substring(0, 3000) : 'Não fornecido.'}

Cargo Alvo: ${target_role || 'Não especificado'}${targetCompanyMI ? `\nEmpresa Alvo: ${targetCompanyMI}` : ''}` : `You are a Senior Executive Recruiter at Share2Inspire conducting a mock interview.

Below is the candidate's CV and target role. Your last question was: "${current_question || 'Tell me about yourself.'}".



Listen to the audio response. Analyze the audio DIRECTLY and evaluate:

1. Content: Did they answer the question? Did they use the STAR method? Were they specific or vague?

2. Delivery & Tone: Were they nervous? Too many filler words ("umm", "uh")? Did they sound confident?

3. Length: Ideal answers are 1-2 minutes. Was it too long or too short?

${miCompanyContext}



RETURN ONLY A VALID JSON WITH THIS STRUCTURE:

{

  "transcription_summary": "A summary of what you heard them say",

  "duration_feedback": "Feedback on response length",

  "delivery_and_tone": "Brutally honest feedback on voice, hesitations, and confidence",

  "content_critique": "Critique on content (Missing STAR? Missing metrics? If target company data available, evaluate if candidate showed company knowledge)",

  "improved_answer": "How a top-tier candidate would have answered (write the ideal script in 1st person, referencing real company data if available)",

  "next_question": "The next interview question to ask, based on their response or an interesting point in their CV (if company data available, ask contextual questions about the company)"

}



Candidate CV:

${interviewCvText ? interviewCvText.substring(0, 3000) : 'Not provided.'}

Target Role: ${target_role || 'Not specified'}${targetCompanyMI ? `\nTarget Company: ${targetCompanyMI}` : ''}`;

        const systemPromptES = isESMI ? `Eres un Senior Executive Recruiter en Share2Inspire, conduciendo una entrevista simulada.

A continuación tienes el CV del candidato y el cargo al que se postula. La última pregunta que le hiciste fue: "${current_question || 'Cuéntame un poco sobre ti y tu experiencia.'}".

Vas a escuchar el audio con la respuesta del candidato. Analiza el audio DIRECTAMENTE y evalúa:

1. Contenido: ¿Respondió a la pregunta? ¿Usó el método STAR (Situación, Tarea, Acción, Resultado) si era aplicable? ¿Fue vago o específico?

2. Entrega y Tono: ¿Estaba nervioso? ¿Hizo muchas pausas ("mmm", "ehh")? ¿El tono de voz transmitía confianza?

3. Duración: Las respuestas ideales de entrevista duran entre 1 y 2 minutos. ¿Fue demasiado larga o demasiado corta?

${miCompanyContext}

DEVUELVE SOLO UN JSON VÁLIDO CON LA SIGUIENTE ESTRUCTURA:

{

  "transcription_summary": "Lo que entendiste de su respuesta (un resumen de lo dicho)",

  "duration_feedback": "Feedback sobre el tiempo de respuesta (corto, largo, ideal)",

  "delivery_and_tone": "Feedback brutalmente honesto sobre la voz, hesitaciones y confianza",

  "content_critique": "Crítica al contenido (faltó el método STAR? Faltaron métricas? Si hay datos de la empresa objetivo, evalúa si el candidato demostró conocimiento de la empresa)",

  "improved_answer": "Cómo un candidato de primer nivel habría respondido a esta misma pregunta (escribe el guión ideal en 1ª persona, referenciando datos reales de la empresa si están disponibles)",

  "next_question": "La siguiente pregunta de entrevista a hacer, basada en la respuesta que acaba de dar u otro punto interesante de su CV (si hay datos de la empresa, haz preguntas contextuales sobre la empresa)"

}

CV del Candidato:

${interviewCvText ? interviewCvText.substring(0, 3000) : 'No proporcionado.'}

Cargo Objetivo: ${target_role || 'No especificado'}${targetCompanyMI ? `\nEmpresa Objetivo: ${targetCompanyMI}` : ''}` : null;

        const finalPrompt = isESMI && systemPromptES ? systemPromptES : systemPrompt;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

        const miResponse = await fetch(geminiUrl, {

          method: 'POST',

          headers: {

            'Content-Type': 'application/json'

          },

          body: JSON.stringify({

            contents: [

              {

                role: 'user',

                parts: [

                  {

                    text: finalPrompt

                  },

                  {

                    inlineData: {

                      mimeType: audioMimeType,

                      data: audio_base64.replace(/^data:audio\/\w+;base64,/, "")

                    }

                  }

                ]

              }

            ],

            generationConfig: {

              temperature: 0.4,

              responseMimeType: 'application/json'

            }

          })

        });

        if (!miResponse.ok) {

          const errorText = await miResponse.text();

          throw new Error(`Erro Gemini Audio: ${errorText}`);

        }

        const geminiData = await miResponse.json();

        const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        const interviewFeedback = JSON.parse(analysisText);

        console.log('✅ Mock Interview analisada com sucesso!');

        return jsonResponse({

          success: true,

          feedback: interviewFeedback

        });

      } catch (error) {

        console.error('❌ Erro no modo mock_interview:', error);

        return jsonResponse({

          success: false,

          error: isPT ? 'Erro ao analisar o áudio da entrevista' : isESMI ? 'Error al analizar el audio de la entrevista' : 'Error analyzing interview audio',

          message: error.message

        }, 500);

      }

    }

    // ─── Company Enrichment (Gemini) ────────────────────────────────────────────

    if (mode === 'company_enrichment') {

      const companyName = body.company_name;

      if (!companyName) {

        return jsonResponse({ success: false, error: 'company_name is required' }, 400);

      }

      try {

        const details = await fetchCompanyDetails(companyName);

        if (!details) {

          return jsonResponse({ success: false, error: 'Company not found', company: null });

        }

        const competitors = await fetchCompetitors(companyName);

        return jsonResponse({

          success: true,

          company: {

            name: details.name,

            description: details.description,

            industry: details.industry,

            employee_count: details.employee_count,

            specialties: details.specialties || [],

            hq: details.hq,

            founded_year: details.founded_year,

            tagline: details.tagline,

            competitors: competitors,

          }

        });

      } catch (err) {

        console.error('Company enrichment error:', err);

        return jsonResponse({ success: false, error: 'Failed to fetch company data', company: null }, 500);

      }

    }

    return jsonResponse({

      success: false,

      error: 'Modo não reconhecido: ' + mode,

      modes: [

        'cv_builder_parse',

        'cv_builder_chat',

        'cv_analysis',

        'cv_extraction',

        'career_coach',

        'career_path',

        'career_intelligence',

        'linkedin_roast',

        'auto_emails',

        'send_analysis_email',

        'mock_interview',

        'company_enrichment'

      ]

    }, 400);

  } catch (error) {

    console.error('❌ Erro geral:', error);

    return jsonResponse({

      success: false,

      error: 'Erro interno do servidor',

      message: error.message

    }, 500);

  }

});