import { useState, type ReactNode } from 'react';
import { I18nContext, getStoredLang, setStoredLang, getTranslation, type Lang } from '@/lib/i18n';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStoredLang);

  function setLang(l: Lang) {
    setLangState(l);
    setStoredLang(l);
  }

  function t(key: string) {
    return getTranslation(lang, key);
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}
