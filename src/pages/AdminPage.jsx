import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  createGiftCodeAdmin,
  createNewsAdmin,
  deleteNewsAdmin,
  fetchAdminAccounts,
  fetchAdminConfig,
  fetchAdminDashboard,
  fetchAdminDonationPackages,
  fetchAdminDownloads,
  fetchAdminLogs,
  fetchAdminNews,
  saveAdminDonationPackage,
  saveAdminDownload,
  saveAdminSettings,
} from '../services/api';
import './AdminPage.scss';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'news', label: 'News' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'donate', label: 'Donate' },
  { id: 'gifts', label: 'Gift Codes' },
  { id: 'settings', label: 'CMS Settings' },
  { id: 'logs', label: 'Audit Log' },
];

export default function AdminPage() {
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [newsList, setNewsList] = useState([]);
  const [news, setNews] = useState({ title: '', content: '', type: 'announcement' });
  const [downloads, setDownloads] = useState([]);
  const [downloadForm, setDownloadForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'client',
    size: '—',
  });
  const [gift, setGift] = useState({
    code: '',
    rewardType: 'credits',
    rewardAmount: 100,
    maxUses: 100,
  });
  const [accountQ, setAccountQ] = useState('');
  const [accountResult, setAccountResult] = useState(null);
  const [settings, setSettings] = useState(null);
  const [packs, setPacks] = useState([]);
  const [packForm, setPackForm] = useState({
    title: '',
    fiatCurrency: 'USD',
    price: 10,
    creditAmount: 1000,
    creditCurrency: 'wcoinc',
  });
  const [logs, setLogs] = useState([]);

  const flash = (text) => {
    setMsg(text);
    setError('');
  };

  const loadDashboard = async () => {
    const res = await fetchAdminDashboard();
    setData(res.data);
  };

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        await loadDashboard();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'AdminCP unavailable.');
      }
    })();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        setError('');
        if (tab === 'news') {
          const res = await fetchAdminNews();
          setNewsList(res.data?.items || []);
        }
        if (tab === 'downloads') {
          const res = await fetchAdminDownloads();
          setDownloads(res.data?.items || []);
        }
        if (tab === 'settings') {
          const res = await fetchAdminConfig();
          setSettings(res.data);
        }
        if (tab === 'donate') {
          const res = await fetchAdminDonationPackages();
          setPacks(res.data?.items || []);
        }
        if (tab === 'logs') {
          const res = await fetchAdminLogs();
          setLogs(res.data?.items || []);
        }
        if (tab === 'dashboard') await loadDashboard();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load module.');
      }
    })();
  }, [tab, isAdmin]);

  if (!authLoading && (!isAuthenticated || !isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  const onCreateNews = async (e) => {
    e.preventDefault();
    try {
      await createNewsAdmin(news);
      flash('News published.');
      setNews({ title: '', content: '', type: 'announcement' });
      const res = await fetchAdminNews();
      setNewsList(res.data?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  const onDeleteNews = async (id) => {
    try {
      await deleteNewsAdmin(id);
      flash('News deleted.');
      const res = await fetchAdminNews();
      setNewsList(res.data?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  const onSaveDownload = async (e) => {
    e.preventDefault();
    try {
      await saveAdminDownload(downloadForm);
      flash('Download saved.');
      setDownloadForm({ title: '', description: '', url: '', type: 'client', size: '—' });
      const res = await fetchAdminDownloads();
      setDownloads(res.data?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  const onCreateGift = async (e) => {
    e.preventDefault();
    try {
      await createGiftCodeAdmin({
        ...gift,
        rewardAmount: Number(gift.rewardAmount),
        maxUses: Number(gift.maxUses),
      });
      flash('Gift code created.');
      setGift({ code: '', rewardType: 'credits', rewardAmount: 100, maxUses: 100 });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  const onSearchAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchAdminAccounts(accountQ);
      setAccountResult(res.data);
      flash(res.data?.items?.length ? 'Account found.' : 'No account found.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed.');
    }
  };

  const onSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await saveAdminSettings({
        server: settings.server,
        features: settings.features,
      });
      setSettings(res.data);
      flash('CMS settings saved.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  const onSavePack = async (e) => {
    e.preventDefault();
    try {
      await saveAdminDonationPackage(packForm);
      flash('Donation package saved.');
      setPackForm({
        title: '',
        fiatCurrency: 'USD',
        price: 10,
        creditAmount: 1000,
        creditCurrency: 'wcoinc',
      });
      const res = await fetchAdminDonationPackages();
      setPacks(res.data?.items || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed.');
    }
  };

  return (
    <section className="cms-page admincp">
      <p className="cms-page__label">WebEngine-style</p>
      <h1 className="cms-page__title">AdminCP</h1>
      <p className="cms-page__subtitle">
        Full CMS control panel. Mode: {data?.mode || '—'} · Backend-enforced admin only.
      </p>

      <div className="cms-tabs admincp__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'is-active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      {tab === 'dashboard' && data && (
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
              <div className="cms-stat__value">{data.donationTransactions ?? 0}</div>
            </div>
          </div>
          <div className="cms-panel">
            <h2 className="admincp__h2">Recent audit</h2>
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
        </>
      )}

      {tab === 'accounts' && (
        <div className="cms-panel">
          <h2 className="admincp__h2">Search account</h2>
          <form className="cms-form" onSubmit={onSearchAccount}>
            <label>
              Username or email
              <input value={accountQ} onChange={(e) => setAccountQ(e.target.value)} required />
            </label>
            <button type="submit" className="btn btn--primary">
              Search
            </button>
          </form>
          {accountResult?.items?.[0] && (
            <div style={{ marginTop: '1.25rem' }}>
              <p>
                <strong>{accountResult.items[0].username}</strong> · {accountResult.items[0].email}
                {accountResult.items[0].isAdmin ? ' · ADMIN' : ''}
              </p>
              <p>
                Credits: {accountResult.items[0].balances?.credits ?? 0} · WCoinC:{' '}
                {accountResult.items[0].balances?.wcoinc ?? 0}
              </p>
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Character</th>
                    <th>Class</th>
                    <th>Level</th>
                    <th>ML</th>
                  </tr>
                </thead>
                <tbody>
                  {(accountResult.items[0].characters || []).map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td>
                      <td>{c.className}</td>
                      <td>{c.level}</td>
                      <td>{c.masterLevel ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'news' && (
        <div className="cms-grid cms-grid--2">
          <div className="cms-panel">
            <h2 className="admincp__h2">Publish news</h2>
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
                  rows={5}
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
            <h2 className="admincp__h2">All posts</h2>
            <ul className="admincp__list">
              {newsList.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <span>
                      {item.type} · {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button type="button" className="btn btn--secondary" onClick={() => onDeleteNews(item.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'downloads' && (
        <div className="cms-grid cms-grid--2">
          <div className="cms-panel">
            <h2 className="admincp__h2">Add / update download</h2>
            <form className="cms-form" onSubmit={onSaveDownload}>
              <label>
                Title
                <input
                  value={downloadForm.title}
                  onChange={(e) => setDownloadForm((d) => ({ ...d, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                URL
                <input
                  value={downloadForm.url}
                  onChange={(e) => setDownloadForm((d) => ({ ...d, url: e.target.value }))}
                />
              </label>
              <label>
                Type
                <select
                  value={downloadForm.type}
                  onChange={(e) => setDownloadForm((d) => ({ ...d, type: e.target.value }))}
                >
                  <option value="client">Client</option>
                  <option value="launcher">Launcher</option>
                  <option value="patch">Patch</option>
                  <option value="tools">Tools</option>
                </select>
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={downloadForm.description}
                  onChange={(e) => setDownloadForm((d) => ({ ...d, description: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn--primary">
                Save
              </button>
            </form>
          </div>
          <div className="cms-panel">
            <h2 className="admincp__h2">Configured downloads</h2>
            <ul className="admincp__list">
              {downloads.map((d) => (
                <li key={d.id}>
                  <div>
                    <strong>{d.title}</strong>
                    <span>
                      {d.type} · {d.url || 'no url'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'donate' && (
        <div className="cms-grid cms-grid--2">
          <div className="cms-panel">
            <h2 className="admincp__h2">Add donation package</h2>
            <form className="cms-form" onSubmit={onSavePack}>
              <label>
                Title
                <input
                  value={packForm.title}
                  onChange={(e) => setPackForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </label>
              <label>
                Fiat currency
                <select
                  value={packForm.fiatCurrency}
                  onChange={(e) => setPackForm((p) => ({ ...p, fiatCurrency: e.target.value }))}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </label>
              <label>
                Price
                <input
                  type="number"
                  value={packForm.price}
                  onChange={(e) => setPackForm((p) => ({ ...p, price: e.target.value }))}
                />
              </label>
              <label>
                WCoinC amount
                <input
                  type="number"
                  value={packForm.creditAmount}
                  onChange={(e) => setPackForm((p) => ({ ...p, creditAmount: e.target.value }))}
                />
              </label>
              <button type="submit" className="btn btn--primary">
                Save package
              </button>
            </form>
            <p className="admincp__note">
              Gateway keys (MP / Stripe / PayPal) go in server .env — not in this panel (secrets).
            </p>
          </div>
          <div className="cms-panel">
            <h2 className="admincp__h2">Packages</h2>
            <table className="cms-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Price</th>
                  <th>WCoinC</th>
                </tr>
              </thead>
              <tbody>
                {packs.map((p) => (
                  <tr key={p.id}>
                    <td>{p.title}</td>
                    <td>
                      {p.price} {p.fiatCurrency}
                    </td>
                    <td>{p.creditAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'gifts' && (
        <div className="cms-panel">
          <h2 className="admincp__h2">Create gift code</h2>
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
              Reward
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
              Max uses
              <input
                type="number"
                value={gift.maxUses}
                onChange={(e) => setGift((g) => ({ ...g, maxUses: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn--secondary">
              Create
            </button>
          </form>
        </div>
      )}

      {tab === 'settings' && settings && (
        <form className="cms-panel" onSubmit={onSaveSettings}>
          <h2 className="admincp__h2">Server info</h2>
          <div className="cms-form" style={{ maxWidth: '100%' }}>
            <div className="cms-grid cms-grid--2">
              {['name', 'season', 'exp', 'masterExp', 'drop', 'discordUrl', 'downloadUrl'].map(
                (key) => (
                  <label key={key}>
                    {key}
                    <input
                      value={settings.server?.[key] ?? ''}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          server: { ...s.server, [key]: e.target.value },
                        }))
                      }
                    />
                  </label>
                ),
              )}
            </div>
            <h2 className="admincp__h2">Feature flags</h2>
            <div className="admincp__flags">
              {Object.entries(settings.features || {}).map(([key, value]) => (
                <label key={key} className="admincp__flag">
                  <input
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        features: { ...s.features, [key]: e.target.checked },
                      }))
                    }
                  />
                  {key}
                </label>
              ))}
            </div>
            <p className="admincp__note">
              Hash method: <strong>{settings.hashMethod}</strong> (change via .env / reinstall). MU
              mode: <strong>{settings.muDatabaseMode}</strong>
            </p>
            <button type="submit" className="btn btn--primary">
              Save settings
            </button>
          </div>
        </form>
      )}

      {tab === 'logs' && (
        <div className="cms-panel">
          <h2 className="admincp__h2">Audit log</h2>
          <table className="cms-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Action</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.at).toLocaleString()}</td>
                  <td>{log.action}</td>
                  <td>{log.username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
