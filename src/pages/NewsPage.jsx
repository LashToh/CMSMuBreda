import { useEffect, useState } from 'react';
import { ApiError, fetchNews } from '../services/api';

export default function NewsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchNews();
        setItems(res.data?.items || []);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'News temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="cms-page">
      <p className="cms-page__label">Chronicles</p>
      <h1 className="cms-page__title">News & Updates</h1>
      <p className="cms-page__subtitle">Announcements, events, and maintenance notices.</p>

      {loading && <div className="cms-loading">Loading news…</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}

      <div className="cms-grid cms-grid--2">
        {items.map((item) => (
          <article key={item.id} className="cms-panel">
            <p className="cms-page__label">{item.type}</p>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '0.5rem' }}>
              {item.title}
            </h2>
            <p style={{ opacity: 0.6, marginBottom: '1rem' }}>
              {item.author} · {new Date(item.createdAt).toLocaleDateString()}
            </p>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', lineHeight: 1.6 }}>
              {item.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
