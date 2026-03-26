/**
 * VagasFeed — Feed de Vagas powered by Adzuna API
 * Componente React integrado na Área de Membro com destaque visual
 * Credenciais pré-configuradas; pesquisa personalizável por país
 * Fully i18n-aware via useI18n hook
 */
import { useState, useEffect, useCallback } from 'react';
import { Briefcase, RefreshCw, ExternalLink } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

// ─── Pre-configured Adzuna credentials ──────────────────────────────────────
const S2I_APP_ID  = '6c8e3465';
const S2I_APP_KEY = 'fb7bb5f2f64806f6454c9bedbe3e1f01';

// ─── Adzuna supported countries (ISO 3166-1 alpha-2 → Adzuna code) ─────────
// Adzuna API supports: at, au, be, br, ca, ch, de, es, fr, gb, in, it, mx, nl, nz, pl, sg, us, za
const ADZUNA_SUPPORTED: Record<string, string> = {
  AT: 'at', AU: 'au', BE: 'be', BR: 'br', CA: 'ca', CH: 'ch',
  DE: 'de', ES: 'es', FR: 'fr', GB: 'gb', IN: 'in', IT: 'it',
  MX: 'mx', NL: 'nl', NZ: 'nz', PL: 'pl', SG: 'sg', US: 'us', ZA: 'za',
};

// Fallback mapping for unsupported countries → nearest supported Adzuna country
const ADZUNA_FALLBACK: Record<string, string> = {
  PT: 'gb', IE: 'gb', SE: 'gb', DK: 'gb', NO: 'gb', FI: 'gb',
  AE: 'gb', HK: 'sg', JP: 'gb', KR: 'gb', CN: 'sg',
  AR: 'br', CL: 'br', CO: 'br', PE: 'br',
};

// Adzuna website domain per country code (for search links)
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

// Default search queries by language
function getDefaultQuery(lang: string): string {
  if (lang === 'pt') return 'recursos humanos carreira';
  return 'human resources career';
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

type FilterType = 'all' | 'remote' | 'local' | 'hr' | 'marketing';

interface VagasFeedProps {
  lang?: string;
  countryCode?: string;  // ISO 3166-1 alpha-2 (e.g. 'PT', 'US', 'GB')
  countryName?: string;  // Display name (e.g. 'Portugal', 'United States')
  region?: string;       // Region/city (e.g. 'Lisboa', 'London')
}

export default function VagasFeed({ lang: langProp, countryCode = 'PT', countryName = 'Portugal', region }: VagasFeedProps) {
  const { t, lang: ctxLang } = useI18n();
  const lang = langProp || ctxLang;

  const adzunaCountry = getAdzunaCountry(countryCode);
  const defaultQuery = getDefaultQuery(lang);
  const locationLabel = region || countryName || 'Portugal';

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

  const isUnsupportedCountry = !ADZUNA_SUPPORTED[countryCode.toUpperCase()];

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    try {
      // When country is not directly supported by Adzuna (e.g. Portugal),
      // search the fallback country WITHOUT location filter to get actual results
      const whereParam = isUnsupportedCountry ? '' : (region || countryName || '');
      // When using fallback to an English-speaking country, always use English query
      const fallbackLang = isUnsupportedCountry && ['gb', 'us', 'au', 'nz', 'za', 'sg', 'in', 'ca'].includes(adzunaCountry) ? 'en' : lang;
      const whatParam = isUnsupportedCountry ? getDefaultQuery(fallbackLang) : defaultQuery;
      const url = `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${S2I_APP_ID}&app_key=${S2I_APP_KEY}&results_per_page=10&what=${encodeURIComponent(whatParam)}&where=${encodeURIComponent(whereParam)}&content-type=application/json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length) {
        const currencySymbol = adzunaCountry === 'gb' ? '£' : adzunaCountry === 'us' ? '$' : '€';
        const mapped: Vaga[] = data.results.map((j: any) => ({
          title:    j.title,
          company:  j.company?.display_name || 'N/A',
          location: j.location?.display_name || countryName,
          salary:   j.salary_min ? `${currencySymbol}${Math.round(j.salary_min / 12).toLocaleString()}–${Math.round(j.salary_max / 12).toLocaleString()}` : null,
          remote:   /remot/i.test(j.title + ' ' + (j.description || '')),
          tags:     j.category?.label ? [j.category.label] : [],
          match:    Math.floor(70 + Math.random() * 25),
          key:      (j.category?.label || '').toLowerCase(),
          url:      j.redirect_url || getAdzunaSearchUrl(adzunaCountry, j.title, j.location?.display_name),
        }));
        setVagas(mapped);
        setIsApiData(true);
      } else {
        setVagas([]);
        setIsApiData(false);
      }
    } catch {
      setVagas([]);
      setIsApiData(false);
    }
    setLoading(false);
  }, [adzunaCountry, defaultQuery, countryName, region, isUnsupportedCountry]);

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
  const noJobsMsg = lang === 'pt'
    ? `Sem vagas encontradas para ${countryName}. Tenta outro filtro.`
    : `No jobs found for ${countryName}. Try another filter.`;
  const unsupportedMsg = lang === 'pt'
    ? `O Adzuna não cobre ${countryName} diretamente. A mostrar vagas internacionais relevantes (via ${ADZUNA_DOMAINS[adzunaCountry]?.replace('www.', '') || adzunaCountry}).`
    : `Adzuna doesn't cover ${countryName} directly. Showing relevant international jobs (via ${ADZUNA_DOMAINS[adzunaCountry]?.replace('www.', '') || adzunaCountry}).`;
  const isUsingFallback = isUnsupportedCountry;

  return (
    <section className="mb-12">
      {/* Section header with gold accent */}
      <div className="flex items-center gap-3 mb-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#BF9A33]/20 to-[#BF9A33]/5 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-[#BF9A33]" />
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#1a1a1a]">
            {t('vf.title')}
          </h2>
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

      {/* Fallback notice */}
      {isUsingFallback && vagas.length > 0 && (
        <div className="mt-2 mb-1 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded text-[10px] text-amber-700">
          {unsupportedMsg}
        </div>
      )}

      {/* Widget container with gold highlight border */}
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
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] text-[#6c757d] border border-[#dee2e6] hover:border-[#BF9A33] hover:text-[#a57b0a] transition-all"
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
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#BF9A33] animate-pulse"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[#6c757d] text-xs">
              {noJobsMsg}
              <br />
              <button
                onClick={() => setActiveFilter('all')}
                className="text-[#a57b0a] font-semibold mt-1 hover:underline"
              >
                {t('vf.viewAll')}
              </button>
            </div>
          ) : (
            filtered.map((v, idx) => {
              const initials = v.company.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              const matchClass = v.match >= 85
                ? 'bg-[#d1f5e0] text-[#0a5c2e]'
                : 'bg-[#fff3cd] text-[#856404]';

              return (
                <a
                  key={idx}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3.5 border-b border-[#e9ecef] last:border-b-0 transition-colors duration-150 cursor-pointer hover:bg-[#fdf8ed] no-underline"
                >
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
        <div className="px-4 py-3 border-t border-[#e9ecef] bg-[#f8f9fa] text-center">
          <a
            href={getAdzunaSearchUrl(adzunaCountry, defaultQuery, region || countryName)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#a57b0a] font-semibold hover:text-[#BF9A33] inline-flex items-center gap-1"
          >
            {t('vf.viewAllAdzuna')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="text-[10px] text-[#999] mt-0.5">
            Powered by Adzuna API {!isApiData && vagas.length === 0 && `· ${t('vf.noResults')}`}
          </div>
        </div>
      </div>
    </section>
  );
}
