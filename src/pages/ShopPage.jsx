import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  fetchShopCategories,
  fetchShopItems,
  purchaseShopItem,
} from '../services/api';

export default function ShopPage() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, list] = await Promise.all([
        fetchShopCategories(),
        fetchShopItems({ categoryId: categoryId || undefined, q: q || undefined }),
      ]);
      setCategories(cats.data?.items || []);
      setItems(list.data?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Donate temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [categoryId]);

  const onPurchase = async (itemId) => {
    setMsg('');
    try {
      const res = await purchaseShopItem(itemId);
      setMsg(res.message || 'Donation recorded.');
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Donation failed.');
    }
  };

  return (
    <section className="cms-page">
      <p className="cms-page__label">Support</p>
      <h1 className="cms-page__title">Donate</h1>
      <p className="cms-page__subtitle">
        Support MU Breda Season 21. Item delivery stays disabled until the Season 21 item format is
        verified.
      </p>

      <div className="cms-alert cms-alert--info">
        Delivery flag OFF by default (`ENABLE_WEBSHOP_DELIVERY=false`). Donations update balances /
        history only.
      </div>

      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      <div className="cms-panel" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Search items…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <button type="button" className="btn btn--secondary" onClick={load}>
          Search
        </button>
      </div>

      {loading ? (
        <div className="cms-loading">Loading donate catalog…</div>
      ) : (
        <div className="cms-grid cms-grid--3">
          {items.map((item) => (
            <article key={item.id} className="cms-panel">
              <h3 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a' }}>{item.name}</h3>
              <p style={{ opacity: 0.8, margin: '0.75rem 0 1rem' }}>{item.description}</p>
              <p style={{ fontFamily: 'Cinzel, serif' }}>
                {item.price} {item.currency}
              </p>
              {isAuthenticated ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  style={{ marginTop: '1rem' }}
                  onClick={() => onPurchase(item.id)}
                >
                  Donate
                </button>
              ) : (
                <Link to="/login" className="btn btn--secondary" style={{ marginTop: '1rem' }}>
                  Login to donate
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
