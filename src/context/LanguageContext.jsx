import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  LOCALES,
  STORAGE_KEY,
  detectBrowserLocale,
  translate,
} from '../i18n';

const LanguageContext = createContext(null);

function readInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    // No saved preference yet — soft-detect from browser languages.
    if (stored === null) {
      return detectBrowserLocale();
    }
    return LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return detectBrowserLocale();
  }
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = useCallback((next) => {
    if (!LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key, params) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}
