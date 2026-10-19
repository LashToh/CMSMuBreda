import { useEffect, useMemo, useState } from 'react';
import { ApiError, fetchAbout } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import './AboutPage.scss';

function pickText(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.es || value.en || value.pt || '';
}

function isUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export default function AboutPage() {
  const { t, locale } = useTranslation();
  const lang = locale || 'es';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sectionId, setSectionId] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchAbout();
        if (!cancelled) {
          setData(res.data);
          const first = res.data?.sections?.[0]?.id;
          if (first) setSectionId(first);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError ? err.message : t('about.loadError'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const sections = data?.sections || [];
  const active = useMemo(
    () => sections.find((s) => s.id === sectionId) || sections[0] || null,
    [sections, sectionId],
  );

  return (
    <section className="cms-page about-page">
      <p className="cms-page__label">{t('about.label')}</p>
      <h1 className="cms-page__title">{t('about.title')}</h1>
      <p className="cms-page__subtitle">{t('about.subtitle')}</p>

      {loading && <div className="cms-loading">{t('about.loading')}</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}

      {!loading && !error && sections.length > 0 && (
        <>
          <div className="cms-tabs about-page__tabs">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={active?.id === section.id ? 'is-active' : ''}
                onClick={() => setSectionId(section.id)}
              >
                {pickText(section.title, lang)}
              </button>
            ))}
          </div>

          {active && (
            <div className="cms-panel about-page__panel">
              <h2 className="about-page__section-title">{pickText(active.title, lang)}</h2>
              <dl className="about-page__list">
                {(active.rows || []).map((row, idx) => {
                  const label = pickText(row.label, lang);
                  const value = row.value || '—';
                  return (
                    <div key={`${active.id}-${idx}`} className="about-page__row">
                      <dt>{label}</dt>
                      <dd>
                        {isUrl(value) ? (
                          <a href={value} target="_blank" rel="noreferrer">
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
        </>
      )}

      {!loading && !error && sections.length === 0 && (
        <div className="cms-empty">{t('about.empty')}</div>
      )}
    </section>
  );
}
