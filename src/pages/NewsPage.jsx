import { useEffect, useState } from 'react';
import { ApiError, fetchNews } from '../services/api';
import { useTranslation } from '../context/LanguageContext';

export default function NewsPage() {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchNews(locale);
        if (!cancelled) setItems(res.data?.items || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError && err.message ? err.message : t('news.error'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return (
    <section className="cms-page">
      <p className="cms-page__label">{t('news.label')}</p>
      <h1 className="cms-page__title">{t('news.title')}</h1>
      <p className="cms-page__subtitle">{t('news.subtitle')}</p>

      {loading && <div className="cms-loading">{t('news.loading')}</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}

      {!loading && !error && items.length === 0 && <div className="cms-empty">{t('news.empty')}</div>}

      <div className="cms-grid cms-grid--2">
        {items.map((item) => (
          <article key={item.id} className="cms-panel">
            <p className="cms-page__label">{item.type}</p>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '0.5rem' }}>
              {item.title}
            </h2>
            <p style={{ opacity: 0.6, marginBottom: '1rem' }}>
              {item.author} · {new Date(item.createdAt).toLocaleDateString(locale)}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {item.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
