/**
 * Centralised i18n module for CV Analyser.
 *
 * Usage:
 *   import { useTranslation } from '@/i18n';
 *   const { t, pick, lang, localePath, switchLangUrl } = useTranslation();
 */
export { useTranslation, localePath, switchLangUrl } from './useTranslation';
export { t, pick, getLang, getCountry, getRegion, type Lang } from './translations';
