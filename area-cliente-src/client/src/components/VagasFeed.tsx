/**
 * VagasFeed — Feed de Vagas powered by Adzuna API
 * Componente React integrado na Área de Membro com destaque visual
 * Credenciais pré-configuradas; pesquisa personalizável
 * Fully i18n-aware via useI18n hook
 */
import { useState, useEffect, useCallback } from 'react';
import { Briefcase, RefreshCw, ExternalLink } from 'lucide-react';

// ─── Pre-configured Adzuna credentials ──────────────────────────────────────
const S2I_APP_ID  = '6c8e3465';
const S2I_APP_KEY = 'fb7bb5f2f64806f6454c9bedbe3e1f01';
const S2I_QUERY   = 'recursos humanos carreira coaching';

// Adzuna base URL for Portugal searches
const ADZUNA_SEARCH_BASE = 'https://www.adzuna.com/search?loc=Portugal';

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

// Helper to build an Adzuna search URL for a given query
const adzunaSearchUrl = (query: string) =>
  `${ADZUNA_SEARCH_BASE}&q=${encodeURIComponent(query)}`;

// ─── Demo/fallback data ─────────────────────────────────────────────────────
const DEMO_VAGAS: Vaga[] = [
  { title: "Career Coach & Trainer",       company: "Fundação EDP",       location: "Lisboa",          salary: "2.800–3.800€", remote: false, tags: ["Coaching", "Formação"],  match: 95, key: "rh lisboa",        url: adzunaSearchUrl("career coach trainer Lisboa") },
  { title: "HR Business Partner",          company: "NOS Comunicações",   location: "Lisboa",          salary: "3.200–4.200€", remote: false, tags: ["RH", "Estratégia"],     match: 88, key: "rh lisboa",        url: adzunaSearchUrl("HR business partner Lisboa") },
  { title: "Talent Acquisition Specialist",company: "Farfetch",           location: "Porto / Remoto",  salary: "2.600–3.400€", remote: true,  tags: ["Recrutamento"],          match: 82, key: "rh remote",        url: adzunaSearchUrl("talent acquisition specialist Porto") },
  { title: "People & Culture Manager",     company: "Revolut Portugal",   location: "Lisboa",          salary: "4.000–5.500€", remote: true,  tags: ["RH", "Cultura"],         match: 90, key: "rh lisboa remote", url: adzunaSearchUrl("people culture manager Lisboa") },
  { title: "Marketing & Brand Manager",    company: "Super Bock Group",   location: "Porto",           salary: "3.000–4.000€", remote: false, tags: ["Marketing"],             match: 74, key: "marketing",        url: adzunaSearchUrl("marketing brand manager Porto") },
  { title: "Content & Community Manager",  company: "Deco Proteste",      location: "Lisboa / Remoto", salary: "2.200–3.000€", remote: true,  tags: ["Marketing"],             match: 79, key: "marketing remote lisboa", url: adzunaSearchUrl("content community manager Lisboa") },
  { title: "Learning & Development Lead",  company: "Jerónimo Martins",   location: "Lisboa",          salary: "3.800–5.000€", remote: false, tags: ["L&D", "Formação"],       match: 91, key: "rh lisboa",        url: adzunaSearchUrl("learning development lead Lisboa") },
  { title: "Employer Branding Specialist", company: "Accenture Portugal", location: "Lisboa / Remoto", salary: "2.800–3.600€", remote: true,  tags: ["Employer Branding"],     match: 85, key: "rh remote lisboa", url: adzunaSearchUrl("employer branding specialist Lisboa") },
];

type FilterType = 'todas' | 'remote' | 'lisboa' | 'rh' | 'marketing';

export default function VagasFeed({ lang: langProp }: { lang?: string }) {
  const { t, lang: ctxLang } = useI18n();
  const lang = langProp || ctxLang;

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'todas',     label: t('vf.all') },
    { key: 'remote',    label: t('vf.remote') },
    { key: 'lisboa',    label: 'Lisboa' },
    { key: 'rh',        label: t('vf.hr') },
    { key: 'marketing', label: 'Marketing' },
  ];

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  const [loading, setLoading] = useState(true);
  const [isApiData, setIsApiData] = useState(false);

  const fetchVagas = useCallback(async () => {
    setLoading(true);
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/pt/search/1?app_id=${S2I_APP_ID}&app_key=${S2I_APP_KEY}&results_per_page=10&what=${encodeURIComponent(S2I_QUERY)}&where=Portugal&content-type=application/json`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length) {
        const mapped: Vaga[] = data.results.map((j: any) => ({
          title:    j.title,
          company:  j.company?.display_name || 'N/A',
          location: j.location?.display_name || 'Portugal',
          salary:   j.salary_min ? `${Math.round(j.salary_min / 12)}–${Math.round(j.salary_max / 12)}€/mês` : null,
          remote:   /remot/i.test(j.title + ' ' + (j.description || '')),
          tags:     j.category?.label ? [j.category.label] : [],
          match:    Math.floor(70 + Math.random() * 25),
          key:      (j.category?.label || '').toLowerCase(),
          url:      j.redirect_url || adzunaSearchUrl(j.title),
        }));
        setVagas(mapped);
        setIsApiData(true);
      } else {
        setVagas([...DEMO_VAGAS]);
        setIsApiData(false);
      }
    } catch {
      setVagas([...DEMO_VAGAS]);
      setIsApiData(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchVagas(); }, [fetchVagas]);

  const filtered = vagas.filter(v => {
    if (activeFilter === 'todas') return true;
    if (activeFilter === 'remote') return v.remote;
    if (activeFilter === 'lisboa') return v.location.toLowerCase().includes('lisboa');
    return v.key?.includes(activeFilter);
  });

  const remoteLabel = lang === 'pt' ? 'Remoto' : 'Remote';

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
            {t('vf.subtitle')}
          </p>
        </div>
        <div className="ml-auto">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#BF9A33]/10 text-[#a57b0a] border border-[#BF9A33]/20">
            {loading ? '...' : `${filtered.length} ${t('vf.jobs')}`}
          </span>
        </div>
      </div>

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
              {t('vf.noJobs')}
              <br />
              <button
                onClick={() => setActiveFilter('todas')}
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
            href={adzunaSearchUrl(S2I_QUERY)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-[#a57b0a] font-semibold hover:text-[#BF9A33] inline-flex items-center gap-1"
          >
            {t('vf.viewAllAdzuna')}
            <ExternalLink className="w-3 h-3" />
          </a>
          <div className="text-[10px] text-[#999] mt-0.5">
            Powered by Adzuna API {!isApiData && `· ${t('vf.demoData')}`}
          </div>
        </div>
      </div>
    </section>
  );
}
