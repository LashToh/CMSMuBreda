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
