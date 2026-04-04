/**
 * VagasFeed — Feed de Vagas powered by Adzuna API
 * Uses real Adzuna API for ALL countries (fallback to nearest supported)
 * Keywords extracted from user's Career Path / CV Analyser analyses
 * For Portugal: uses Adzuna ES (Spain) as nearest fallback + LinkedIn Jobs link
 * Company enrichment via NinjaPear (Nubela) API
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Briefcase, RefreshCw, ExternalLink, Search, AlertCircle, Linkedin, Building2, Users, MapPin, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// ─── Adzuna proxy via Supabase Edge Function ──────────────────────────────
const SUPABASE_URL = 'https://cvlumvgrbuolrnwrtrgz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NjcyMjQsImV4cCI6MjA1MzE0MzIyNH0.WXJOFGSNqlaOBRBUKMOGRqPB7-Qs1KHaVjDiSMkNfNg';
const ADZUNA_PROXY_URL = `${SUPABASE_URL}/functions/v1/adzuna-proxy`;
const HYPER_TASK_URL = `${SUPABASE_URL}/functions/v1/hyper-task`;

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
    if (PT_TO_EN_KEYWORDS[lower]) return PT_TO_EN_KEYWORDS[lower];
    for (const [pt, en] of Object.entries(PT_TO_EN_KEYWORDS)) {
      if (lower.includes(pt)) return kw.toLowerCase().replace(pt, en);
    }
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

interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  employee_count: number | null;
  specialties: string[];
  hq: string;
  founded_year: number | null;
  tagline: string;
  competitors: string[];
}

type FilterType = 'all' | 'remote' | 'local' | 'hr' | 'marketing';

interface VagasFeedProps {
  lang?: string;
  countryCode?: string;
  countryName?: string;
  region?: string;
}

// ─── NinjaPear company cache ───────────────────────────────────────────────
const companyCache = new Map<string, CompanyInfo | null>();

async function fetchCompanyInfo(companyName: string): Promise<CompanyInfo | null> {
  if (!companyName || companyName.length < 2) return null;
  const cacheKey = companyName.toLowerCase().trim();
  if (companyCache.has(cacheKey)) return companyCache.get(cacheKey) || null;

  try {
    const res = await fetch(HYPER_TASK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        mode: 'company_enrichment',
        company_name: companyName,
      }),
    });
    if (!res.ok) {
      companyCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    if (data.success && data.company) {
      companyCache.set(cacheKey, data.company);
      return data.company;
    }
    companyCache.set(cacheKey, null);
    return null;
  } catch {
    companyCache.set(cacheKey, null);
    return null;
  }
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

      if (a.analysis_type === 'cv_analyser') {
        const kws = d.keywords || d.analysis?.keywords || [];
        if (Array.isArray(kws)) kws.forEach((k: string) => keywords.add(k));
        if (d.perceivedRole) keywords.add(d.perceivedRole);
      }

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

      if (a.analysis_type === 'career_path') {
        const cpJson = d.career_path_json || d.career_path || {};
        if (cpJson.title) keywords.add(cpJson.title);
      }
    }

    return Array.from(keywords).filter(k => k && k.length > 2).slice(0, 6);
  } catch {
    return [];
  }
}

// ─── Company Detail Card (mobile-responsive) ──────────────────────────────
function CompanyDetailCard({ companyName, lang, onClose }: { companyName: string; lang: string; onClose: () => void }) {
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);
  const isPT = lang === 'pt';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCompanyInfo(companyName).then(data => {
      if (!cancelled) {
        setInfo(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [companyName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (loading) {
    return (
      <div ref={cardRef} className="mt-2 mx-2 sm:mx-0 p-4 bg-gradient-to-br from-[#fdf8ed] to-white border border-[#BF9A33]/25 rounded-lg shadow-md animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-[#a57b0a] text-xs">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {isPT ? 'A carregar dados da empresa...' : 'Loading company data...'}
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div ref={cardRef} className="mt-2 mx-2 sm:mx-0 p-3 bg-[#f8f9fa] border border-[#e9ecef] rounded-lg text-xs text-[#6c757d]">
        {isPT ? 'Dados da empresa não disponíveis.' : 'Company data not available.'}
        <button onClick={onClose} className="ml-2 text-[#a57b0a] font-medium hover:underline">{isPT ? 'Fechar' : 'Close'}</button>
      </div>
    );
  }

  const formatEmployees = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(0)}M+`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K+`;
    return count.toLocaleString();
  };

  return (
    <div ref={cardRef} className="mt-2 mx-2 sm:mx-0 bg-gradient-to-br from-[#fdf8ed] to-white border border-[#BF9A33]/25 rounded-lg shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2.5 border-b border-[#BF9A33]/15 flex items-center gap-2">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#BF9A33]/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#BF9A33]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-[#2c3e50] truncate">{info.name}</h4>
          {info.tagline && <p className="text-[10px] text-[#6c757d] truncate">{info.tagline}</p>}
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-[#BF9A33]/10 transition-colors flex-shrink-0">
          <X className="w-3.5 h-3.5 text-[#6c757d]" />
        </button>
      </div>

      {/* Body */}
      <div className="px-3 sm:px-4 py-3 space-y-2.5">
        {/* Description */}
        {info.description && (
          <p className="text-[11px] sm:text-xs text-[#495057] leading-relaxed line-clamp-3">
            {info.description.length > 250 ? info.description.substring(0, 250) + '...' : info.description}
          </p>
        )}

        {/* Key metrics — responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {info.industry && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#495057]">
              <Briefcase className="w-3 h-3 text-[#BF9A33] flex-shrink-0" />
              <span className="truncate">{info.industry}</span>
            </div>
          )}
          {info.employee_count && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#495057]">
              <Users className="w-3 h-3 text-[#BF9A33] flex-shrink-0" />
              <span>{formatEmployees(info.employee_count)} {isPT ? 'funcionários' : 'employees'}</span>
            </div>
          )}
          {info.hq && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#495057]">
              <MapPin className="w-3 h-3 text-[#BF9A33] flex-shrink-0" />
              <span className="truncate">{info.hq}</span>
            </div>
          )}
          {info.founded_year && (
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-[#495057]">
              <span className="w-3 h-3 text-[#BF9A33] flex-shrink-0 text-center font-bold text-[9px]">Est</span>
              <span>{info.founded_year}</span>
            </div>
          )}
        </div>

        {/* Specialties */}
        {info.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {info.specialties.slice(0, 5).map((s, i) => (
              <span key={i} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#BF9A33]/8 border border-[#BF9A33]/15 text-[#856404] font-medium">
                {s}
              </span>
            ))}
            {info.specialties.length > 5 && (
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 text-[#999]">
                +{info.specialties.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Competitors */}
        {info.competitors.length > 0 && (
          <div className="pt-1 border-t border-[#e9ecef]">
            <p className="text-[10px] font-medium text-[#6c757d] mb-1">
              {isPT ? 'Empresas similares:' : 'Similar companies:'}
            </p>
            <div className="flex flex-wrap gap-1">
              {info.competitors.slice(0, 4).map((c, i) => (
                <span key={i} className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-[#f0f4ff] border border-[#c7d2fe] text-[#4338ca] font-medium">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer — powered by */}
      <div className="px-3 sm:px-4 py-1.5 border-t border-[#e9ecef] bg-[#f8f9fa]/50">
        <p className="text-[9px] text-[#adb5bd] text-center">
          Powered by NinjaPear
        </p>
      </div>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function VagasFeed({ lang: langProp, countryCode = 'PT', countryName = 'Portugal', region }: VagasFeedProps) {
  const { t, lang: ctxLang } = useI18n();
  const { user } = useAuth();
  const lang = langProp || ctxLang;

  const adzunaCountry = getAdzunaCountry(countryCode);
  const locationLabel = region || countryName || 'Portugal';
  const isUnsupportedCountry = !ADZUNA_SUPPORTED[countryCode.toUpperCase()];

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',       label: t('vf.all') },
    { key: 'remote',    label: t('vf.remote') },
    { key: 'local',     label: locationLabel.split(' / ')[0].split(' (')[0] },
    { key: 'hr',        label: t('vf.hr') },
    { key: 'marketing', label: 'Marketing' },
  ];

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const [isApiData, setIsApiData] = useState(false);
  const [userKeywords, setUserKeywords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      getUserKeywords(user.id).then(kws => setUserKeywords(kws));
    }
  }, [user?.id]);

  const buildSearchQuery = useCallback((keywords: string[], forceEnglish = false): string => {
    const useEnglish = forceEnglish || isUnsupportedCountry;
    if (keywords.length > 0) {
      const kws = useEnglish ? translateKeywordsToEnglish(keywords) : keywords;
      const limit = isUnsupportedCountry ? 1 : 3;
      return kws.slice(0, limit).join(' ');
    }
    return (lang === 'pt' && !useEnglish) ? 'recursos humanos gestão' : 'human resources management';
  }, [lang, isUnsupportedCountry]);

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandedCompany(null);

    const query = buildSearchQuery(userKeywords);
    const whereParam = isUnsupportedCountry ? '' : (region || countryName || '');

    try {
      const proxyParams = new URLSearchParams({
        country: adzunaCountry,
        what: query,
        results_per_page: '10',
      });
      if (whereParam) proxyParams.set('where', whereParam);
      const url = `${ADZUNA_PROXY_URL}?${proxyParams.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.results?.length) {
        const currencySymbol = adzunaCountry === 'gb' ? '£' : adzunaCountry === 'us' ? '$' : '€';
        const mapped: Vaga[] = data.results.map((j: any) => {
          const title = (j.title || '').replace(/<\/?[^>]+(>|$)/g, '');
          const company = j.company?.display_name || '';
          const loc = j.location?.display_name || countryName || '';
          const isRemote = /remot/i.test(title + ' ' + (j.description || '') + ' ' + loc);
          const tags: string[] = [];
          if (j.category?.label) tags.push(j.category.label);

          const titleLower = title.toLowerCase();
          const matchCount = userKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length;
          const baseMatch = 65 + Math.floor(Math.random() * 15);
          const keywordBonus = Math.min(matchCount * 10, 25);
          const match = Math.min(baseMatch + keywordBonus, 99);

          return {
            title,
            company,
            location: loc,
            salary: j.salary_min && j.salary_max
              ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}–${Math.round(j.salary_max / 12).toLocaleString()}`
              : j.salary_min
                ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}+`
                : null,
            remote: isRemote,
            tags,
            match,
            key: (j.category?.label || '').toLowerCase(),
            url: j.redirect_url || getAdzunaSearchUrl(adzunaCountry, title, loc),
          };
        });

        mapped.sort((a, b) => b.match - a.match);
        setVagas(mapped);
        setIsApiData(true);
      } else if (isUnsupportedCountry && query !== 'management') {
        const retryParams = new URLSearchParams({
          country: adzunaCountry,
          what: 'management',
          results_per_page: '10',
        });
        const retryUrl = `${ADZUNA_PROXY_URL}?${retryParams.toString()}`;
        const retryRes = await fetch(retryUrl);
        const retryData = await retryRes.json();
        if (retryData.results?.length) {
          const currencySymbol = adzunaCountry === 'gb' ? '£' : adzunaCountry === 'us' ? '$' : '€';
          const mapped: Vaga[] = retryData.results.map((j: any) => {
            const title = (j.title || '').replace(/<\/?[^>]+(>|$)/g, '');
            const company = j.company?.display_name || '';
            const loc = j.location?.display_name || countryName || '';
            const isRemote = /remot/i.test(title + ' ' + (j.description || '') + ' ' + loc);
            const tags: string[] = [];
            if (j.category?.label) tags.push(j.category.label);
            const match = 60 + Math.floor(Math.random() * 15);
            return {
              title, company, location: loc,
              salary: j.salary_min && j.salary_max
                ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}–${Math.round(j.salary_max / 12).toLocaleString()}`
                : j.salary_min ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}+` : null,
              remote: isRemote, tags, match,
              key: (j.category?.label || '').toLowerCase(),
              url: j.redirect_url || getAdzunaSearchUrl(adzunaCountry, title, loc),
            };
          });
          mapped.sort((a, b) => b.match - a.match);
          setVagas(mapped);
          setIsApiData(true);
        } else {
          setVagas([]);
          setIsApiData(false);
          setError(lang === 'pt'
            ? 'Sem vagas encontradas para esta pesquisa. Tenta alterar o país ou região.'
            : 'No jobs found for this search. Try changing the country or region.');
        }
      } else {
        setVagas([]);
        setIsApiData(false);
        setError(lang === 'pt'
          ? 'Sem vagas encontradas para esta pesquisa. Tenta alterar o país ou região.'
          : 'No jobs found for this search. Try changing the country or region.');
      }
    } catch (err) {
      console.error('Adzuna fetch error:', err);
      setVagas([]);
      setIsApiData(false);
      setError(lang === 'pt'
        ? 'Erro ao carregar vagas. Tenta novamente.'
        : 'Error loading jobs. Please try again.');
    }
    setLoading(false);
  }, [adzunaCountry, buildSearchQuery, userKeywords, countryName, region, lang]);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  const filtered = vagas.filter(v => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'remote') return v.remote;
    if (activeFilter === 'local') return v.location.toLowerCase().includes(locationLabel.toLowerCase().split(' / ')[0].split(' (')[0].toLowerCase());
    if (activeFilter === 'hr') return /hr|human|recursos|rh|people|talent/i.test(v.title + ' ' + v.tags.join(' '));
    if (activeFilter === 'marketing') return /marketing|brand|content|digital|social/i.test(v.title + ' ' + v.tags.join(' '));
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

  const handleCompanyClick = (e: React.MouseEvent, companyName: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (expandedCompany === companyName) {
      setExpandedCompany(null);
    } else {
      setExpandedCompany(companyName);
    }
  };

  return (
    <section className="mb-12">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BF9A33]/20 to-[#BF9A33]/5 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-[#BF9A33]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-medium text-[#1a1a1a]">{t('vf.title')}</h2>
          <p className="text-[11px] text-[#999] font-light truncate">
            {t('vf.subtitle')} · {countryName}{region ? ` — ${region}` : ''}
          </p>
        </div>
        <div className="flex-shrink-0">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#BF9A33]/10 text-[#a57b0a] border border-[#BF9A33]/20">
            {loading ? '...' : `${filtered.length} ${t('vf.jobs')}`}
          </span>
        </div>
      </div>

      {/* User keywords indicator */}
      {userKeywords.length > 0 && (
        <div className="mt-2 mb-1 px-3 py-1.5 bg-[#C9A961]/5 border border-[#C9A961]/15 rounded text-[10px] text-[#a57b0a] flex items-center gap-1.5">
          <Search className="w-3 h-3 shrink-0" />
          <span className="truncate">
            {lang === 'pt' ? 'Pesquisa baseada no teu perfil:' : 'Search based on your profile:'}{' '}
            <span className="font-medium">{userKeywords.slice(0, 3).join(', ')}</span>
          </span>
        </div>
      )}

      {/* Fallback notice */}
      {isUnsupportedCountry && vagas.length > 0 && (
        <div className="mt-2 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700 flex items-center gap-1.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span className="line-clamp-2">{sourceLabel}</span>
        </div>
      )}

      {/* Widget container */}
      <div className="mt-4 border border-[#BF9A33]/25 rounded-lg overflow-hidden bg-white shadow-sm">

        {/* Filters bar — horizontal scroll on mobile */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeFilter === f.key
                  ? 'bg-[#BF9A33] text-[#1a1a1a] border-[#BF9A33] font-semibold'
                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#BF9A33]/40 hover:text-[#1a1a1a]'
              }`}
            >
              {f.label}
            </button>
          ))}
          <div className="flex-1 min-w-[8px]" />
          <button
            onClick={fetchVagas}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-[#6c757d] border border-[#dee2e6] hover:border-[#BF9A33]/40 hover:text-[#1a1a1a] transition-all whitespace-nowrap flex-shrink-0"
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
              const isExpanded = expandedCompany === v.company;

              return (
                <div key={idx} className="border-b border-[#e9ecef] last:border-b-0">
                  <div className="px-3 sm:px-4 py-3 sm:py-3.5 transition-colors duration-150 hover:bg-[#fdf8ed]">
                    {/* Job header row */}
                    <div className="flex items-start gap-2 sm:gap-2.5 mb-2">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#f8f9fa] border border-[#e9ecef] flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-[#6c757d] flex-shrink-0 uppercase">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] sm:text-[13px] font-semibold text-[#2c3e50] leading-tight">{v.title}</div>
                        {/* Company name — clickable to expand details */}
                        <button
                          onClick={(e) => handleCompanyClick(e, v.company)}
                          className="text-[11px] text-[#a57b0a] mt-0.5 hover:underline flex items-center gap-0.5 font-medium"
                        >
                          <Building2 className="w-2.5 h-2.5" />
                          {v.company}
                          {isExpanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                      {/* Match + View job — stack on mobile */}
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${matchClass}`}>
                          {v.match}%
                        </span>
                        <a href={v.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold text-[#a57b0a] bg-[#BF9A33]/10 border border-[#BF9A33]/20 hover:bg-[#BF9A33]/20 transition-colors no-underline whitespace-nowrap">
                          {lang === 'pt' ? 'Ver' : 'View'}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>

                    {/* Tags row — wrap on mobile */}
                    <div className="flex gap-1 sm:gap-1.5 flex-wrap ml-10 sm:ml-[46px]">
                      <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#f8f9fa] border border-[#e9ecef] text-[#6c757d] font-medium">
                        📍 {v.location}
                      </span>
                      {v.salary && (
                        <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#d1f5e0] border border-[#a8e6c3] text-[#0a5c2e] font-medium">
                          💶 {v.salary}
                        </span>
                      )}
                      {v.remote && (
                        <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#dbeafe] border border-[#93c5fd] text-[#003d8f] font-medium">
                          🏠 {remoteLabel}
                        </span>
                      )}
                      {v.tags.map((tag, ti) => (
                        <span key={ti} className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#f8f9fa] border border-[#e9ecef] text-[#6c757d] font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded company detail card */}
                  {isExpanded && v.company && (
                    <CompanyDetailCard
                      companyName={v.company}
                      lang={lang}
                      onClose={() => setExpandedCompany(null)}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-3 sm:px-4 py-3 border-t border-[#e9ecef] bg-[#f8f9fa]">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <a href={getAdzunaSearchUrl(adzunaCountry, buildSearchQuery(userKeywords), region || countryName)}
              target="_blank" rel="noopener noreferrer"
              className="text-[11px] sm:text-[12px] text-[#a57b0a] font-semibold hover:text-[#BF9A33] inline-flex items-center gap-1">
              {t('vf.viewAllAdzuna')}
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-[#ddd]">|</span>
            <a href={linkedInSearchUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] sm:text-[12px] text-[#0077b5] font-semibold hover:text-[#005582] inline-flex items-center gap-1">
              <Linkedin className="w-3 h-3" />
              LinkedIn Jobs
            </a>
          </div>
          <div className="text-[9px] sm:text-[10px] text-[#999] mt-1 text-center">
            Powered by Adzuna API · NinjaPear
            {isUnsupportedCountry && ` · ${lang === 'pt' ? 'Vagas Internacionais' : 'International Jobs'}`}
            {userKeywords.length > 0 && ` · ${lang === 'pt' ? 'Personalizado ao teu perfil' : 'Personalized to your profile'}`}
          </div>
        </div>
      </div>
    </section>
  );
}
