/**
 * VagasFeed — Feed de Vagas powered by Adzuna API
 * Uses real Adzuna API for ALL countries (fallback to nearest supported)
 * Keywords extracted from user's Career Path / CV Analyser analyses
 * For Portugal: uses Adzuna ES (Spain) as nearest fallback + LinkedIn Jobs link
 */
import { useState, useEffect, useCallback } from 'react';
import { Briefcase, RefreshCw, ExternalLink, Search, AlertCircle, Linkedin } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─── Adzuna proxy via Supabase Edge Function ──────────────────────────────
// Credentials are stored in Supabase secrets (S2I_APP_ID, S2I_APP_KEY)
// Frontend calls the Edge Function which proxies to Adzuna API
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const ADZUNA_PROXY_URL = `${SUPABASE_URL}/functions/v1/adzuna-proxy`;

// ─── Adzuna supported countries ────────────────────────────────────────────
const ADZUNA_SUPPORTED: Record<string, string> = {
  AT: 'at', AU: 'au', BE: 'be', BR: 'br', CA: 'ca', CH: 'ch',
  DE: 'de', ES: 'es', FR: 'fr', GB: 'gb', IN: 'in', IT: 'it',
  MX: 'mx', NL: 'nl', NZ: 'nz', PL: 'pl', SG: 'sg', US: 'us', ZA: 'za',
};

const ADZUNA_FALLBACK: Record<string, string> = {
  PT: 'gb', IE: 'gb', SE: 'gb', DK: 'gb', NO: 'gb', FI: 'gb',
  AE: 'gb', HK: 'sg', JP: 'gb', KR: 'gb', CN: 'sg',
  AR: 'br', CL: 'br', CO: 'br', PE: 'br',
};

// Map of common PT keywords to EN equivalents for international search
const PT_TO_EN_KEYWORDS: Record<string, string> = {
  'recursos humanos': 'human resources',
  'gestão': 'management',
  'marketing': 'marketing',
  'engenharia': 'engineering',
  'tecnologia': 'technology',
  'saúde': 'healthcare',
  'educação': 'education',
  'finanças': 'finance',
  'vendas': 'sales',
  'design': 'design',
  'comunicação': 'communications',
  'logística': 'logistics',
  'administração': 'administration',
  'contabilidade': 'accounting',
  'direito': 'law',
  'consultoria': 'consulting',
  'fisioterapia': 'physiotherapy',
  'fisioterapeuta': 'physiotherapist',
  'enfermagem': 'nursing',
  'medicina': 'medicine',
  'farmácia': 'pharmacy',
  'arquitectura': 'architecture',
  'arquitecto': 'architect',
  'psicologia': 'psychology',
  'nutrição': 'nutrition',
  'desporto': 'sports',
  'turismo': 'tourism',
  'hotelaria': 'hospitality',
  'transformação digital': 'digital transformation',
  'excelência de processos': 'process excellence',
  'gestão de mudança': 'change management',
  'liderança': 'leadership',
  'desenvolvimento': 'development',
  'programação': 'programming',
  'dados': 'data',
  'inteligência artificial': 'artificial intelligence',
};

function translateKeywordsToEnglish(keywords: string[]): string[] {
  return keywords.map(kw => {
    const lower = kw.toLowerCase().trim();
    // Direct match
    if (PT_TO_EN_KEYWORDS[lower]) return PT_TO_EN_KEYWORDS[lower];
    // Partial match — check if any PT key is contained in the keyword
    for (const [pt, en] of Object.entries(PT_TO_EN_KEYWORDS)) {
      if (lower.includes(pt)) return kw.toLowerCase().replace(pt, en);
    }
    // Return original if no translation found (might already be English)
    return kw;
  });
}

const ADZUNA_DOMAINS: Record<string, string> = {
  at: 'www.adzuna.at', au: 'www.adzuna.com.au', be: 'www.adzuna.be',
  br: 'www.adzuna.com.br', ca: 'www.adzuna.ca', ch: 'www.adzuna.ch',
  de: 'www.adzuna.de', es: 'www.adzuna.es', fr: 'www.adzuna.fr',
  gb: 'www.adzuna.co.uk', in: 'www.adzuna.in', it: 'www.adzuna.it',
  mx: 'www.adzuna.com.mx', nl: 'www.adzuna.nl', nz: 'www.adzuna.co.nz',
  pl: 'www.adzuna.pl', sg: 'www.adzuna.sg', us: 'www.adzuna.com', za: 'www.adzuna.co.za',
};

function getAdzunaCountry(isoCode: string): string {
  const upper = (isoCode || 'GB').toUpperCase();
  return ADZUNA_SUPPORTED[upper] || ADZUNA_FALLBACK[upper] || 'gb';
}

function getAdzunaSearchUrl(adzunaCountry: string, query: string, location?: string): string {
  const domain = ADZUNA_DOMAINS[adzunaCountry] || 'www.adzuna.co.uk';
  const params = new URLSearchParams({ q: query });
  if (location) params.set('w', location);
  return `https://${domain}/jobs/search?${params.toString()}`;
}

function getLinkedInJobsUrl(query: string, location?: string): string {
  const params = new URLSearchParams({ keywords: query });
  if (location) params.set('location', location);
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

// ─── Types ──────────────────────────────────────────────────────────────────
interface Vaga {
  title: string;
  company: string;
  location: string;
  salary: string | null;
  remote: boolean;
  tags: string[];
  match: number;
  key: string;
  url: string;
}

type FilterType = string;

interface VagasFeedProps {
  lang?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
  jobArea?: string;
  workMode?: 'remote' | 'hybrid' | 'onsite';
}

// ─── Extract user keywords from analyses ────────────────────────────────────
async function getUserKeywords(userId: string): Promise<string[]> {
  try {
    const { data: analyses } = await supabase
      .from('user_analyses')
      .select('analysis_type, data')
      .eq('user_id', userId)
      .in('analysis_type', ['cv_analyser', 'career_path', 'career_intelligence'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (!analyses?.length) return [];

    const keywords = new Set<string>();

    for (const a of analyses) {
      const d = a.data;
      if (!d) continue;

      // CV Analyser keywords
      if (a.analysis_type === 'cv_analyser') {
        const kws = d.keywords || d.analysis?.keywords || [];
        if (Array.isArray(kws)) kws.forEach((k: string) => keywords.add(k));
        if (d.perceivedRole) keywords.add(d.perceivedRole);
      }

      // Career Intelligence — associated roles from strategic paths
      if (a.analysis_type === 'career_intelligence') {
        const paths = d.strategic_paths || [];
        for (const p of paths) {
          if (p.associated_roles) {
            (p.associated_roles as string[]).forEach((r: string) => keywords.add(r));
          }
          if (p.name) keywords.add(p.name);
        }
        if (d.decision_recommendation?.recommended_path) {
          keywords.add(d.decision_recommendation.recommended_path);
        }
      }

      // Career Path — career path title
      if (a.analysis_type === 'career_path') {
        const cpJson = d.career_path_json || d.career_path || {};
        if (cpJson.title) keywords.add(cpJson.title);
      }
    }

    // Truncate long keywords (e.g. "Head of HR Digital Transformation") to max 3 words
    // to avoid overly restrictive Adzuna searches
    return Array.from(keywords)
      .filter(k => k && k.length > 2)
      .map(k => {
        const words = k.trim().split(/\s+/);
        return words.length > 3 ? words.slice(0, 3).join(' ') : k;
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function VagasFeed({ lang: langProp, countryCode = 'PT', countryName = 'Portugal', region, jobArea, workMode }: VagasFeedProps) {
  const { t, lang: ctxLang } = useI18n();
  const { user } = useAuth();
  const lang = langProp || ctxLang;

  const adzunaCountry = getAdzunaCountry(countryCode);
  const locationLabel = region || countryName || 'Portugal';
  const isUnsupportedCountry = !ADZUNA_SUPPORTED[countryCode.toUpperCase()];

  // Build dynamic filters from profile preferences
  const FILTERS: { key: FilterType; label: string }[] = (() => {
    const filters: { key: FilterType; label: string }[] = [
      { key: 'all', label: t('vf.all') },
    ];
    // Work mode filters
    if (!workMode || workMode === 'remote' || workMode === 'hybrid') {
      filters.push({ key: 'remote', label: t('vf.remote') });
    }
    // Location filter
    filters.push({ key: 'local', label: locationLabel.split(' / ')[0].split(' (')[0] });
    // Area-based filter from profile
    if (jobArea) {
      // Split by comma in case user entered multiple areas
      const areas = jobArea.split(',').map(a => a.trim()).filter(Boolean);
      areas.slice(0, 3).forEach(area => {
        const key = `area_${area.toLowerCase().replace(/\s+/g, '_')}`;
        filters.push({ key, label: area });
      });
    } else {
      // Fallback to generic filters if no area set
      filters.push({ key: 'area_hr', label: t('vf.hr') });
      filters.push({ key: 'area_marketing', label: 'Marketing' });
    }
    return filters;
  })();

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [isApiData, setIsApiData] = useState(false);
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load user keywords from analyses
  useEffect(() => {
    if (user?.id) {
      getUserKeywords(user.id).then(kws => setUserKeywords(kws));
    }
  }, [user?.id]);

  // Build a single-keyword query to avoid overly restrictive Adzuna searches
  // Adzuna treats space-separated words as AND, so "Head of HR Global HR Process" returns 0 results
  const buildSearchQuery = useCallback((keywords: string[], forceEnglish = false): string => {
    const useEnglish = forceEnglish || isUnsupportedCountry;
    if (keywords.length > 0) {
      const kws = useEnglish ? translateKeywordsToEnglish(keywords) : keywords;
      // ALWAYS use only the first (most relevant) keyword to avoid AND-chaining
      return kws[0];
    }
    // Use jobArea from profile if available
    if (jobArea) {
      const areaKw = useEnglish ? (PT_TO_EN_KEYWORDS[jobArea.toLowerCase()] || jobArea) : jobArea;
      return areaKw;
    }
    return (lang === 'pt' && !useEnglish) ? 'recursos humanos gestão' : 'human resources management';
  }, [lang, isUnsupportedCountry, jobArea]);

  // Helper to map Adzuna results to Vaga objects
  const mapResults = useCallback((results: any[], matchBase: number = 65): Vaga[] => {
    const currencySymbol = adzunaCountry === 'gb' ? '£' : adzunaCountry === 'us' ? '$' : '€';
    return results.map((j: any) => {
      const title = (j.title || '').replace(/<\/?[^>]+(>|$)/g, '');
      const company = j.company?.display_name || '';
      const loc = j.location?.display_name || countryName || '';
      const isRemote = /remot/i.test(title + ' ' + (j.description || '') + ' ' + loc);
      const tags: string[] = [];
      if (j.category?.label) tags.push(j.category.label);
      const titleLower = title.toLowerCase();
      const matchCount = userKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length;
      const baseMatch = matchBase + Math.floor(Math.random() * 15);
      const keywordBonus = Math.min(matchCount * 10, 25);
      const match = Math.min(baseMatch + keywordBonus, 99);
      return {
        title, company, location: loc,
        salary: j.salary_min && j.salary_max
          ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}–${Math.round(j.salary_max / 12).toLocaleString()}`
          : j.salary_min ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}+` : null,
        remote: isRemote, tags, match,
        key: (j.category?.label || '').toLowerCase(),
        url: j.redirect_url || getAdzunaSearchUrl(adzunaCountry, title, loc),
      };
    }).sort((a: Vaga, b: Vaga) => b.match - a.match);
  }, [adzunaCountry, countryName, userKeywords]);

  // Helper to call the Adzuna proxy
  const callAdzuna = useCallback(async (what: string, where?: string): Promise<any[]> => {
    const params = new URLSearchParams({ country: adzunaCountry, what, results_per_page: '10' });
    if (where) params.set('where', where);
    const res = await fetch(`${ADZUNA_PROXY_URL}?${params.toString()}`);
    const data = await res.json();
    return data.results || [];
  }, [adzunaCountry]);

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    setError(null);

    const primaryQuery = buildSearchQuery(userKeywords);
    // When using a fallback country (e.g. PT→GB), don't send the original country as location
    const whereParam = isUnsupportedCountry ? '' : (region || countryName || '');

    // Build a progressive retry chain: specific keyword → jobArea → generic
    const retryChain: { query: string; where: string; matchBase: number }[] = [
      { query: primaryQuery, where: whereParam, matchBase: 65 },
    ];

    // If primary query is from analyses (not jobArea), add jobArea as fallback
    const areaFallback = jobArea
      ? (PT_TO_EN_KEYWORDS[jobArea.toLowerCase()] || jobArea)
      : null;
    if (areaFallback && areaFallback.toLowerCase() !== primaryQuery.toLowerCase()) {
      retryChain.push({ query: areaFallback, where: whereParam, matchBase: 60 });
    }

    // Generic fallback without location constraint
    const genericQuery = areaFallback || 'human resources management';
    if (genericQuery.toLowerCase() !== primaryQuery.toLowerCase()) {
      retryChain.push({ query: genericQuery, where: '', matchBase: 55 });
    }

    // Last resort: very broad keyword
    retryChain.push({ query: 'management', where: '', matchBase: 50 });

    try {
      for (const attempt of retryChain) {
        const results = await callAdzuna(attempt.query, attempt.where);
        if (results.length > 0) {
          setVagas(mapResults(results, attempt.matchBase));
          setIsApiData(true);
          setLoading(false);
          return;
        }
      }
      // All retries exhausted
      setVagas([]);
      setIsApiData(false);
      setError(lang === 'pt'
        ? 'Sem vagas encontradas para esta pesquisa. Tenta alterar o país ou região.'
        : 'No jobs found for this search. Try changing the country or region.');
    } catch (err) {
      console.error('Adzuna fetch error:', err);
      setVagas([]);
      setIsApiData(false);
      setError(lang === 'pt'
        ? 'Erro ao carregar vagas. Tenta novamente.'
        : 'Error loading jobs. Please try again.');
    }
    setLoading(false);
  }, [adzunaCountry, buildSearchQuery, userKeywords, countryName, region, lang, isUnsupportedCountry, jobArea, callAdzuna, mapResults]);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  const filtered = vagas.filter(v => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'remote') return v.remote;
    if (activeFilter === 'local') return v.location.toLowerCase().includes(locationLabel.toLowerCase().split(' / ')[0].split(' (')[0].toLowerCase());
    // Dynamic area filters
    if (activeFilter.startsWith('area_')) {
      const areaLabel = activeFilter.replace('area_', '').replace(/_/g, ' ');
      // Check if area matches in title, tags, or company
      const searchText = (v.title + ' ' + v.tags.join(' ') + ' ' + v.company).toLowerCase();
      // Also check English translation
      const enEquiv = PT_TO_EN_KEYWORDS[areaLabel] || areaLabel;
      return searchText.includes(areaLabel) || searchText.includes(enEquiv.toLowerCase());
    }
    return true;
  });

  const remoteLabel = lang === 'pt' ? 'Remoto' : 'Remote';
  const noJobsMsg = lang === 'pt' ? 'Sem vagas para este filtro.' : 'No jobs for this filter.';

  const sourceLabel = isUnsupportedCountry
    ? (lang === 'pt'
      ? `A mostrar vagas do mercado internacional. Para vagas exclusivas de ${countryName}, usa o LinkedIn Jobs.`
      : `Showing international jobs. For jobs exclusive to ${countryName}, use LinkedIn Jobs.`)
    : '';

  const linkedInSearchUrl = getLinkedInJobsUrl(
    buildSearchQuery(userKeywords),
    region || countryName || ''
  );

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BF9A33]/20 to-[#BF9A33]/5 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-[#BF9A33]" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#1a1a1a]">{t('vf.title')}</h2>
          <p className="text-[11px] text-[#999] font-light">
            {t('vf.subtitle')} · {countryName}{region ? ` — ${region}` : ''}
          </p>
        </div>
        <div className="ml-auto">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#BF9A33]/10 text-[#a57b0a] border border-[#BF9A33]/20">
            {loading ? '...' : `${filtered.length} ${t('vf.jobs')}`}
          </span>
        </div>
      </div>

      {/* User keywords indicator */}
      {userKeywords.length > 0 && (
        <div className="mt-2 mb-1 px-3 py-1.5 bg-[#C9A961]/5 border border-[#C9A961]/15 rounded text-[10px] text-[#a57b0a] flex items-center gap-1.5">
          <Search className="w-3 h-3 shrink-0" />
          {lang === 'pt' ? 'Pesquisa baseada no teu perfil:' : 'Search based on your profile:'}{' '}
          <span className="font-medium">{userKeywords.slice(0, 3).join(', ')}</span>
        </div>
      )}

      {/* Fallback notice */}
      {isUnsupportedCountry && vagas.length > 0 && (
        <div className="mt-2 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {sourceLabel}
        </div>
      )}

      {/* Widget container */}
      <div className="mt-4 border border-[#BF9A33]/25 rounded-lg overflow-hidden bg-white shadow-sm">

        {/* Filters bar */}
        <div className="px-4 py-2.5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 ${
                activeFilter === f.key
                  ? 'bg-[#BF9A33] text-[#1a1a1a] border-[#BF9A33] font-semibold'
                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#BF9A33]/40 hover:text-[#1a1a1a]'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={fetchVagas}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#6c757d] border border-[#dee2e6] hover:border-[#BF9A33]/40 hover:text-[#1a1a1a] transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {t('vf.refresh')}
          </button>
        </div>

        {/* Job list */}
        <div className="max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#BF9A33 #f8f9fa' }}>
          {loading ? (
            <div className="flex gap-1.5 justify-center py-10">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full bg-[#BF9A33] animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : error && vagas.length === 0 ? (
            <div className="py-10 text-center text-[#6c757d] text-xs space-y-2">
              <AlertCircle className="w-5 h-5 mx-auto text-amber-400 mb-2" />
              <p>{error}</p>
              <a href={linkedInSearchUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#0077b5] font-medium hover:underline">
                <Linkedin className="w-3.5 h-3.5" />
                {lang === 'pt' ? 'Procurar no LinkedIn Jobs' : 'Search on LinkedIn Jobs'}
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[#6c757d] text-xs">
              {noJobsMsg}
              <br />
              <button onClick={() => setActiveFilter('all')} className="text-[#a57b0a] font-semibold mt-1 hover:underline">
                {t('vf.viewAll')}
              </button>
            </div>
          ) : (
            filtered.map((v, idx) => {
              const initials = v.company ? v.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
              const matchClass = v.match >= 85 ? 'bg-[#d1f5e0] text-[#0a5c2e]' : v.match >= 70 ? 'bg-[#fff3cd] text-[#856404]' : 'bg-[#f8f9fa] text-[#6c757d]';

              return (
                <a key={idx} href={v.url} target="_blank" rel="noopener noreferrer"
                  className="block px-4 py-3.5 border-b border-[#e9ecef] last:border-b-0 transition-colors duration-150 cursor-pointer hover:bg-[#fdf8ed] no-underline">
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-[#f8f9fa] border border-[#e9ecef] flex items-center justify-center text-[11px] font-bold text-[#6c757d] flex-shrink-0 uppercase">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#2c3e50] leading-tight">{v.title}</div>
                      <div className="text-[11px] text-[#6c757d] mt-0.5">{v.company}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${matchClass}`}>
                        {v.match}% match
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-[#a57b0a] bg-[#BF9A33]/10 border border-[#BF9A33]/20 hover:bg-[#BF9A33]/20 transition-colors">
                        {lang === 'pt' ? 'Ver vaga' : 'View job'}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#f8f9fa] border border-[#e9ecef] text-[#6c757d] font-medium">
                      📍 {v.location}
                    </span>
                    {v.salary && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#d1f5e0] border border-[#a8e6c3] text-[#0a5c2e] font-medium">
                        💶 {v.salary}
                      </span>
                    )}
                    {v.remote && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#dbeafe] border border-[#93c5fd] text-[#003d8f] font-medium">
                        🏠 {remoteLabel}
                      </span>
                    )}
                    {v.tags.map((tag, ti) => (
                      <span key={ti} className="text-[10px] px-2 py-0.5 rounded bg-[#f8f9fa] border border-[#e9ecef] text-[#6c757d] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </a>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#e9ecef] bg-[#f8f9fa]">
          <div className="flex items-center justify-center gap-4">
            <a href={getAdzunaSearchUrl(adzunaCountry, buildSearchQuery(userKeywords), region || countryName)}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-[#a57b0a] font-semibold hover:text-[#BF9A33] inline-flex items-center gap-1">
              {t('vf.viewAllAdzuna')}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[#ddd]">|</span>
            <a href={linkedInSearchUrl} target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-[#0077b5] font-semibold hover:text-[#005582] inline-flex items-center gap-1">
              <Linkedin className="w-3 h-3" />
              LinkedIn Jobs
            </a>
          </div>
          <div className="text-[10px] text-[#999] mt-1 text-center">
            Powered by Adzuna API
            {isUnsupportedCountry && ` · ${lang === 'pt' ? 'Vagas Internacionais' : 'International Jobs'}`}
            {userKeywords.length > 0 && ` · ${lang === 'pt' ? 'Personalizado ao teu perfil' : 'Personalized to your profile'}`}
          </div>
        </div>
      </div>
    </section>
  );
}
