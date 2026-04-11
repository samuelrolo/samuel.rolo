import { useState, type ReactNode } from 'react';
import { I18nContext, getStoredLang, setStoredLang, getTranslation, type Lang, type I18nPickInput } from '@/lib/i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  function setLang(l: Lang) {
    setLangState(l);
    setStoredLang(l);
  }

  function t(key: string) {
    return getTranslation(lang, key);
  }

  function pick(ptOrMap: string | I18nPickInput, en?: string, es?: string) {
    if (typeof ptOrMap === 'string') {
      return lang === 'en' ? (en ?? ptOrMap) : lang === 'es' ? (es ?? ptOrMap) : ptOrMap;
    }
    return ptOrMap[lang];
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t, pick }}>
      {children}
    </I18nContext.Provider>
  );
}
