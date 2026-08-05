import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  createGiftCodeAdmin,
  createNewsAdmin,
  fetchAdminDashboard,
} from '../services/api';

export default function AdminPage() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [news, setNews] = useState({ title: '', content: '', type: 'announcement' });
  const [gift, setGift] = useState({
    code: '',
    rewardType: 'credits',
    rewardAmount: 100,
    maxUses: 100,
  });

  const load = async () => {
    try {
      const res = await fetchAdminDashboard();
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Admin dashboard unavailable.');
    }
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!authLoading && (!isAuthenticated || !isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  const onCreateNews = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createNewsAdmin(news);
      setMsg('News created.');
      setNews({ title: '', content: '', type: 'announcement' });
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Failed to create news.');
    }
  };

  const onCreateGift = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await createGiftCodeAdmin({
        ...gift,
        rewardAmount: Number(gift.rewardAmount),
        maxUses: Number(gift.maxUses),
      });
      setMsg('Gift code created.');
      setGift({ code: '', rewardType: 'credits', rewardAmount: 100, maxUses: 100 });
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Failed to create gift code.');
    }
  };

  return (
    <section className="cms-page">
      <p className="cms-page__label">Administration</p>
      <h1 className="cms-page__title">Admin Panel</h1>
      <p className="cms-page__subtitle">
        Backend-enforced admin access. Mode: {data?.mode || '—'}.
      </p>

      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      {data && (
        <>
          <div className="cms-grid cms-grid--4">
            <div className="cms-stat">
              <div className="cms-stat__label">Accounts</div>
              <div className="cms-stat__value">{data.stats?.accounts ?? '—'}</div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">Characters</div>
              <div className="cms-stat__value">{data.stats?.characters ?? '—'}</div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">Online</div>
              <div className="cms-stat__value">{data.stats?.playersOnline ?? '—'}</div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">Donations</div>
              <div className="cms-stat__value">{data.webshopPurchases ?? 0}</div>
            </div>
          </div>

          <div className="cms-grid cms-grid--2">
            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Create News
              </h2>
              <form className="cms-form" onSubmit={onCreateNews}>
                <label>
                  Type
                  <select
                    value={news.type}
                    onChange={(e) => setNews((n) => ({ ...n, type: e.target.value }))}
                  >
                    <option value="announcement">Announcement</option>
                    <option value="update">Update</option>
                    <option value="event">Event</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </label>
                <label>
                  Title
                  <input
                    value={news.title}
                    onChange={(e) => setNews((n) => ({ ...n, title: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Content
                  <textarea
                    rows={4}
                    value={news.content}
                    onChange={(e) => setNews((n) => ({ ...n, content: e.target.value }))}
                    required
                  />
                </label>
                <button type="submit" className="btn btn--primary">
                  Publish
                </button>
              </form>
            </div>

            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Create Gift Code
              </h2>
              <form className="cms-form" onSubmit={onCreateGift}>
                <label>
                  Code
                  <input
                    value={gift.code}
                    onChange={(e) => setGift((g) => ({ ...g, code: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Reward Type
                  <select
                    value={gift.rewardType}
                    onChange={(e) => setGift((g) => ({ ...g, rewardType: e.target.value }))}
                  >
                    <option value="credits">Credits</option>
                    <option value="wcoinc">WCoinC</option>
                    <option value="goblin">Goblin Points</option>
                  </select>
                </label>
                <label>
                  Amount
                  <input
                    type="number"
                    value={gift.rewardAmount}
                    onChange={(e) => setGift((g) => ({ ...g, rewardAmount: e.target.value }))}
                  />
                </label>
                <label>
                  Max Uses
                  <input
                    type="number"
                    value={gift.maxUses}
                    onChange={(e) => setGift((g) => ({ ...g, maxUses: e.target.value }))}
                  />
                </label>
                <button type="submit" className="btn btn--secondary">
                  Create Code
                </button>
              </form>
            </div>
          </div>

          <div className="cms-panel">
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
              Recent Audit Log
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Action</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recentAudit || []).map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.at).toLocaleString()}</td>
                      <td>{log.action}</td>
                      <td>{log.username || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
