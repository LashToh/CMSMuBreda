import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  changeEmail,
  changePassword,
  fetchAccount,
  redeemGiftCode,
  unstuckCharacter,
} from '../services/api';

export default function AccountPage() {
  const { isAuthenticated, loading: authLoading, refresh } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [mail, setMail] = useState({
    currentEmail: '',
    currentPassword: '',
    newEmail: '',
    confirmEmail: '',
  });
  const [giftCode, setGiftCode] = useState('');
  const [msg, setMsg] = useState('');
  const [selectedChar, setSelectedChar] = useState('');
  const [busyUnstuck, setBusyUnstuck] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAccount();
      setData(res.data);
      const chars = res.data?.characters || [];
      if (chars.length && !selectedChar) {
        const offline = chars.find((c) => !c.online) || chars[0];
        setSelectedChar(offline.name);
      }
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

  const onChangeEmail = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const res = await changeEmail(mail);
      setMsg(res.message || 'Email changed.');
      setMail({
        currentEmail: '',
        currentPassword: '',
        newEmail: '',
        confirmEmail: '',
      });
      await load();
      try {
        await refresh();
      } catch {
        /* ignore */
      }
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Failed to change email.');
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

  const onUnstuck = async (e) => {
    e.preventDefault();
    if (!selectedChar) return;
    setMsg('');
    setBusyUnstuck(true);
    try {
      const res = await unstuckCharacter(selectedChar);
      setMsg(res.message || `${selectedChar} moved to safe zone.`);
      await load();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : 'Unstuck failed.');
    } finally {
      setBusyUnstuck(false);
    }
  };

  const selected = data?.characters?.find((c) => c.name === selectedChar);

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
          </div>

          <div className="cms-grid cms-grid--2">
            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Change Password
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

              <h2
                style={{
                  fontFamily: 'Cinzel, serif',
                  color: '#f0d08a',
                  margin: '2rem 0 1rem',
                }}
              >
                Change Email
              </h2>
              <form className="cms-form" onSubmit={onChangeEmail}>
                <label>
                  Current Email
                  <input
                    type="email"
                    value={mail.currentEmail}
                    onChange={(e) => setMail((m) => ({ ...m, currentEmail: e.target.value }))}
                    autoComplete="email"
                    required
                  />
                </label>
                <label>
                  Current Password
                  <input
                    type="password"
                    value={mail.currentPassword}
                    onChange={(e) => setMail((m) => ({ ...m, currentPassword: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  New Email
                  <input
                    type="email"
                    value={mail.newEmail}
                    onChange={(e) => setMail((m) => ({ ...m, newEmail: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Confirm New Email
                  <input
                    type="email"
                    value={mail.confirmEmail}
                    onChange={(e) => setMail((m) => ({ ...m, confirmEmail: e.target.value }))}
                    required
                  />
                </label>
                <button type="submit" className="btn btn--secondary">
                  Change Email
                </button>
              </form>
            </div>

            {data.features?.unstuck !== false ? (
              <div className="cms-panel">
                <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                  Unstuck
                </h2>
                <p style={{ opacity: 0.75, marginBottom: '1rem' }}>
                  Move a stuck character to the safe zone. Character must be offline.
                </p>
                {data.characters?.length ? (
                  <form className="cms-form" onSubmit={onUnstuck}>
                    <label>
                      Character
                      <select
                        value={selectedChar}
                        onChange={(e) => setSelectedChar(e.target.value)}
                        required
                      >
                        {data.characters.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                            {c.online ? ' (online)' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="btn btn--secondary"
                      disabled={busyUnstuck || Boolean(selected?.online)}
                    >
                      {busyUnstuck ? 'Moving…' : 'Unstuck character'}
                    </button>
                    {selected?.online && (
                      <p style={{ opacity: 0.7, margin: 0 }}>Log out of the game first.</p>
                    )}
                  </form>
                ) : (
                  <div className="cms-empty">No characters to unstuck.</div>
                )}
              </div>
            ) : (
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
            )}
          </div>

          {data.features?.unstuck !== false && (
            <div className="cms-panel">
              <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginBottom: '1rem' }}>
                Gift Code
              </h2>
              <form className="cms-form" onSubmit={onRedeem} style={{ maxWidth: 420 }}>
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
          )}
        </>
      )}
    </section>
  );
}
