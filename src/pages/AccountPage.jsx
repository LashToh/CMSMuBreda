import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  changePassword,
  fetchAccount,
  redeemGiftCode,
} from '../services/api';

export default function AccountPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [giftCode, setGiftCode] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAccount();
      setData(res.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to retrieve account information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated]);

  if (!authLoading && !isAuthenticated) return <Navigate to="/login" replace />;

  const onChangePassword = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await changePassword(pwd);
      setMsg(res.message || 'Password changed.');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Failed to change password.');
    }
  };

  const onRedeem = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await redeemGiftCode(giftCode);
      setMsg(res.message || 'Code redeemed.');
      setGiftCode('');
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Redemption failed.');
    }
  };

  return (
    <section className="cms-page">
      <p className="cms-page__label">Account Panel</p>
      <h1 className="cms-page__title">Dashboard</h1>
      <p className="cms-page__subtitle">Overview, characters, currencies, and security.</p>

      {loading && <div className="cms-loading">Loading account…</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      {data && (
        <>
          <div className="cms-grid cms-grid--4">
            <div className="cms-stat">
              <div className="cms-stat__label">Account</div>
              <div className="cms-stat__value" style={{ fontSize: '1.2rem' }}>
                {data.username}
              </div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">Credits</div>
              <div className="cms-stat__value">{data.balances?.credits ?? 0}</div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">WCoinC</div>
              <div className="cms-stat__value">{data.balances?.wcoinc ?? 0}</div>
            </div>
            <div className="cms-stat">
              <div className="cms-stat__label">Goblin Points</div>
              <div className="cms-stat__value">{data.balances?.goblin ?? 0}</div>
            </div>
          </div>

          <div className="cms-panel">
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
              Characters
            </h2>
            {data.characters?.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="cms-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Level</th>
                      <th>ML</th>
                      <th>Total</th>
                      <th>PK</th>
                      <th>Guild</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.characters.map((c) => (
                      <tr key={c.name}>
                        <td>{c.name}</td>
                        <td>{c.className}</td>
                        <td>{c.level}</td>
                        <td>{c.masterLevel ?? '—'}</td>
                        <td>
                          {c.totalLevel ??
                            Number(c.level || 0) + Number(c.masterLevel || 0)}
                        </td>
                        <td>{c.pkCount ?? 0}</td>
                        <td>{c.guild || '—'}</td>
                        <td>{c.online ? 'Online' : 'Offline'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="cms-empty">No characters found on this account.</div>
            )}
            <p style={{ marginTop: '1rem', opacity: 0.7 }}>
              This server has no resets or grand resets. Character tools (Clear PK, Unstuck)
              remain gated until Season 21 schema verification. Flags: clearPk=
              {String(data.features?.clearPk)}.
            </p>
          </div>

          <div className="cms-grid cms-grid--2">
            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Security
              </h2>
              <form className="cms-form" onSubmit={onChangePassword}>
                <label>
                  Current Password
                  <input
                    type="password"
                    value={pwd.currentPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Confirm Password
                  <input
                    type="password"
                    value={pwd.confirmPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                  />
                </label>
                <button type="submit" className="btn btn--primary">
                  Change Password
                </button>
              </form>
            </div>

            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Gift Code
              </h2>
              <form className="cms-form" onSubmit={onRedeem}>
                <label>
                  Code
                  <input
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value)}
                    placeholder="WELCOME21"
                    required
                  />
                </label>
                <button type="submit" className="btn btn--secondary">
                  Redeem
                </button>
              </form>
              <p style={{ marginTop: '1rem' }}>
                <Link to="/donate">Visit Donate →</Link>
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
