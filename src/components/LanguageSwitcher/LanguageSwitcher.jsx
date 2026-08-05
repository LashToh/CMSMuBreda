import { LOCALE_LABELS, LOCALES } from '../../i18n';
import { useTranslation } from '../../context/LanguageContext';
import './LanguageSwitcher.scss';

export default function LanguageSwitcher({ className = '', compact = false }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`lang-switcher ${compact ? 'lang-switcher--compact' : ''} ${className}`.trim()}
      role="group"
      aria-label={t('common.selectLanguage')}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switcher__btn ${locale === code ? 'lang-switcher__btn--active' : ''}`}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
          aria-label={LOCALE_LABELS[code]}
        >
          {LOCALE_LABELS[code]}
        </button>
      ))}
    </div>
  );
}
