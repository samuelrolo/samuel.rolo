/**
 * useTranslation hook — provides i18n utilities for React components.
 *
 * Usage:
 *   const { t, pick, lang, localePath } = useTranslation();
 *   <h1>{t('hero_title')}</h1>
 *   <a href={localePath('/cv-analyser')}>...</a>
 */
import { t as translate, pick as pickFn, getLang, type Lang } from './translations';

/* ── URL path mapping (PT canonical → EN / ES equivalents) ── */
const pathMap: Record<string, Record<string, string>> = {
  '/':                    { en: '/en',                    es: '/es' },
  '/cv-analyser':         { en: '/en/cv-analyser',        es: '/es/cv-analyser' },
  '/career-path':         { en: '/en/career-path',        es: '/es/career-path' },
  '/career-intelligence': { en: '/en/career-intelligence', es: '/es/career-intelligence' },
  '/linkedin-roaster':    { en: '/en/linkedin-roaster',    es: '/es/linkedin-roaster' },
  '/bundle':              { en: '/en/bundle',              es: '/es/bundle' },
  '/estudante':           { en: '/en/student-pack',        es: '/es/student-pack' },
  '/conhecimento':        { en: '/en/pages/knowledge',     es: '/es/pages/knowledge' },
  '/servicos':            { en: '/en/pages/services',      es: '/es/pages/services' },
  '/sobre':               { en: '/en/about',               es: '/es/sobre' },
  '/contactos':           { en: '/en/contact',             es: '/es/contacto' },
  '/area-cliente':        { en: '/area-cliente/?lang=en',   es: '/area-cliente/?lang=es' },
};

/**
 * Convert a PT-canonical path to the equivalent path in the current language.
 * If no mapping exists, prepends the language prefix (e.g. /en/some-path).
 */
export function localePath(ptPath: string, lang?: Lang): string {
  const l = lang || getLang();
  if (l === 'pt') return ptPath;
  return pathMap[ptPath]?.[l] || `/${l}${ptPath}`;
}

/**
 * Build the equivalent URL for a different language from the current page.
 * Used by the language switcher in the header.
 */
export function switchLangUrl(targetLang: Lang): string {
  const currentPath = window.location.pathname;
  const search = window.location.search;

  // Strip current lang prefix to get the "base" path
  let basePath = currentPath;
  if (currentPath.startsWith('/en/')) basePath = currentPath.slice(3);
  else if (currentPath.startsWith('/es/')) basePath = currentPath.slice(3);
  else if (currentPath === '/en' || currentPath === '/es') basePath = '/';

  // Map known EN/ES paths back to PT canonical
  const reverseMap: Record<string, string> = {};
  for (const [pt, langs] of Object.entries(pathMap)) {
    for (const [, mapped] of Object.entries(langs)) {
      // Strip query params from mapped path for matching
      const cleanMapped = mapped.split('?')[0];
      reverseMap[cleanMapped] = pt;
    }
  }

  // Try to find the PT canonical path
  const ptCanonical = reverseMap[basePath] || basePath;

  // Now map to target language
  if (targetLang === 'pt') return ptCanonical + search;
  return (pathMap[ptCanonical]?.[targetLang] || `/${targetLang}${ptCanonical}`) + search;
}

/**
 * Main hook — call once per component.
 */
export function useTranslation() {
  const lang = getLang();

  return {
    /** Current language */
    lang,
    /** Translate a key */
    t: (key: string, replacements?: Record<string, string>) => translate(key, lang, replacements),
    /** Pick between PT / EN / ES inline values (strings or JSX) */
    pick: <T = string>(pt: T, en: T, es: T): T => pickFn<T>(pt, en, es, lang),
    /** Convert a PT-canonical path to the current language equivalent */
    localePath: (ptPath: string) => localePath(ptPath, lang),
    /** Get the URL to switch to a different language */
    switchLangUrl,
  };
}

export default useTranslation;
