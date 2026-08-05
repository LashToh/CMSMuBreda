import { useEffect, useState } from 'react';
import { ApiError, fetchDownloads, fetchServerInfo } from '../services/api';

export default function DownloadsPage() {
  const [items, setItems] = useState([]);
  const [server, setServer] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, s] = await Promise.all([fetchDownloads(), fetchServerInfo()]);
        setItems(d.data?.items || []);
        setServer(s.data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Downloads temporarily unavailable.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="cms-page">
      <p className="cms-page__label">Client</p>
      <h1 className="cms-page__title">Downloads</h1>
      <p className="cms-page__subtitle">
        {server
          ? `${server.name} Season ${server.season} — EXP ${server.exp} · Drop ${server.drop}`
          : 'Get the Season 21 client and patches.'}
      </p>

      {loading && <div className="cms-loading">Loading downloads…</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}

      <div className="cms-grid cms-grid--3">
        {items.map((item) => (
          <article key={item.id} className="cms-panel">
            <p className="cms-page__label">{item.type}</p>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a' }}>{item.title}</h2>
            <p style={{ opacity: 0.8, margin: '0.75rem 0 1rem' }}>{item.description}</p>
            <p style={{ opacity: 0.6, marginBottom: '1rem' }}>Size: {item.size}</p>
            {item.url ? (
              <a className="btn btn--primary" href={item.url} target="_blank" rel="noreferrer">
                Download
              </a>
            ) : (
              <span className="cms-alert cms-alert--info">Link pending configuration</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
