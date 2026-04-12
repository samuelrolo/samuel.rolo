/**
 * useTranslation hook — provides i18n utilities for React components.
 *
 * Usage:
 *   const { t, pick, lang, localePath } = useTranslation();
 *   <h1>{t('hero_title')}</h1>
 *   <a href={localePath('/cv-analyser')}>...</a>
 */
import {
  getCanonicalPtPath,
  resolvePageId,
  switchPathToLang,
  getLocalizedPath,
} from '@/config/navigation';
import { t as translate, pick as pickFn, getLang, type Lang } from './translations';

/**
 * Convert a PT-canonical path to the equivalent path in the current language.
 * If the path matches a known route, use the central navigation config.
 * Otherwise, fall back to prefixing the language.
 */
export function localePath(ptPath: string, lang?: Lang): string {
  const l = lang || getLang();
  const pageId = resolvePageId(ptPath) || resolvePageId(getCanonicalPtPath(ptPath));

  if (pageId) {
    return getLocalizedPath(pageId, l);
  }

  const canonicalPtPath = getCanonicalPtPath(ptPath);
  if (l === 'pt') return canonicalPtPath;
  return canonicalPtPath === '/' ? `/${l}` : `/${l}${canonicalPtPath}`;
}

/**
 * Build the equivalent URL for a different language from the current page.
 * Used by the language switcher in the header.
 */
export function switchLangUrl(targetLang: Lang): string {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return switchPathToLang(currentPath, targetLang);
}

/**
 * Main hook — call once per component.
 */
export function useTranslation() {
  const lang = getLang();

  return {
    lang,
    t: (key: string, replacements?: Record<string, string>) => translate(key, lang, replacements),
    pick: <T = string>(pt: T, en: T, es: T): T => pickFn<T>(pt, en, es, lang),
    localePath: (ptPath: string) => localePath(ptPath, lang),
    switchLangUrl,
  };
}

export default useTranslation;
