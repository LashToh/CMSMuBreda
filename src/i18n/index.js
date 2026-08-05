import en from './translations/en';
import es from './translations/es';
import pt from './translations/pt';

export const LOCALES = ['en', 'es', 'pt'];
export const DEFAULT_LOCALE = 'en';
export const STORAGE_KEY = 'mubreda-locale';

export const translations = { en, es, pt };

export const LOCALE_LABELS = {
  en: 'EN',
  es: 'ES',
  pt: 'PT',
};

/** Map a BCP 47 / Accept-Language tag to a supported locale, or null if unmatched. */
function mapLanguageTag(tag) {
  if (!tag || typeof tag !== 'string') return null;
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  if (primary === 'es') return 'es';
  if (primary === 'pt') return 'pt';
  if (primary === 'en') return 'en';
  return null;
}

/**
 * Detect preferred locale from the browser (navigator.languages / navigator.language).
 * Falls back to DEFAULT_LOCALE when unavailable or unsupported.
 */
export function detectBrowserLocale() {
  try {
    if (typeof navigator === 'undefined') return DEFAULT_LOCALE;

    const candidates = [
      ...(Array.isArray(navigator.languages) ? navigator.languages : []),
      navigator.language,
    ].filter(Boolean);

    for (const tag of candidates) {
      const locale = mapLanguageTag(tag);
      if (locale) return locale;
    }
  } catch {
    /* ignore detection errors */
  }
  return DEFAULT_LOCALE;
}

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : undefined), obj);
}

export function translate(locale, key, params = {}) {
  const dict = translations[locale] ?? translations[DEFAULT_LOCALE];
  let value = getNested(dict, key);

  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = getNested(translations[DEFAULT_LOCALE], key);
  }

  if (value === undefined) return key;

  if (typeof value !== 'string') return value;

  return Object.entries(params).reduce(
    (str, [param, replacement]) => str.replaceAll(`{${param}}`, String(replacement)),
    value,
  );
}
