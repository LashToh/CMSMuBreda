import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  createGiftCodeAdmin,
  createNewsAdmin,
  deleteNewsAdmin,
  fetchAdminAccounts,
  fetchAdminConfigFull,
  fetchAdminDashboard,
  fetchAdminDonationPackages,
  fetchAdminDownloads,
  fetchAdminLogs,
  fetchAdminNews,
  saveAdminDonationPackage,
  saveAdminDownload,
  saveAdminSecrets,
  saveAdminConfigFull,
  fetchAdminSecrets,
} from '../services/api';
import './AdminPage.scss';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'news', label: 'News' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'donate', label: 'Donate' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'gifts', label: 'Gift Codes' },
  { id: 'settings', label: 'CMS Settings' },
  { id: 'logs', label: 'Audit Log' },
];

const SETTINGS_SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'auth', label: 'Auth / Registration' },
  { id: 'currencies', label: 'Currencies' },
  { id: 'tools', label: 'Character tools' },
  { id: 'security', label: 'Security' },
  { id: 'schema', label: 'MU Schema' },
  { id: 'db', label: 'Database' },
];

const emptyCurrency = () => ({ table: '', column: '', userColumn: '' });

function buildSettingsForm(full) {
  return {
    general: {
      server: {
        name: full?.general?.server?.name || '',
        season: full?.general?.server?.season || '',
        exp: full?.general?.server?.exp || '',
        masterExp: full?.general?.server?.masterExp || '',
        drop: full?.general?.server?.drop || '',
        maxLevel: full?.general?.server?.maxLevel ?? 1750,
        maxMasterLevel: full?.general?.server?.maxMasterLevel ?? 400,
        resetLevel: full?.general?.server?.resetLevel ?? 400,
        discordUrl: full?.general?.server?.discordUrl || '',
        downloadUrl: full?.general?.server?.downloadUrl || '',
        instagramUrl: full?.general?.server?.instagramUrl || '',
        facebookUrl: full?.general?.server?.facebookUrl || '',
      },
      corsOrigin: full?.general?.corsOrigin || '',
      trustProxy: full?.general?.trustProxy ?? 1,
    },
    features: { ...(full?.features || {}) },
    auth: {
      hashMethod: full?.auth?.hashMethod || 'md5',
      sha256Salt: '',
      adminUsernames: full?.auth?.adminUsernames || '',
      jwtExpiresIn: full?.auth?.jwtExpiresIn || '7d',
      jwtSecret: '',
      cookieName: full?.auth?.cookieName || 'mubreda_session',
      cookieSecure: Boolean(full?.auth?.cookieSecure),
      cookieSameSite: full?.auth?.cookieSameSite || 'lax',
      registration: {
        defaultSnoNumb: full?.auth?.registration?.defaultSnoNumb || '1111111111111',
        insertViCurrInfo: Boolean(full?.auth?.registration?.insertViCurrInfo),
        allowDuplicateEmails: Boolean(full?.auth?.registration?.allowDuplicateEmails),
      },
    },
    tools: {
      unstuckMap: full?.tools?.unstuckMap ?? 0,
      unstuckX: full?.tools?.unstuckX ?? 125,
      unstuckY: full?.tools?.unstuckY ?? 125,
      clearPkLevel: full?.tools?.clearPkLevel ?? 3,
    },
    currencies: {
      credits: { ...emptyCurrency(), ...(full?.currencies?.credits || {}) },
      wcoinc: { ...emptyCurrency(), column: 'WCoinC', userColumn: 'AccountID', ...(full?.currencies?.wcoinc || {}) },
      wcoinp: { ...emptyCurrency(), column: 'WCoinP', userColumn: 'AccountID', ...(full?.currencies?.wcoinp || {}) },
      goblin: {
        ...emptyCurrency(),
        column: 'GoblinPoint',
        userColumn: 'AccountID',
        ...(full?.currencies?.goblin || {}),
      },
    },
    rateLimit: {
      windowMs: full?.rateLimit?.windowMs ?? 900000,
      max: full?.rateLimit?.max ?? 100,
      authMax: full?.rateLimit?.authMax ?? 10,
      registerMax: full?.rateLimit?.registerMax ?? 5,
    },
    muSchema: {
      accounts: { ...(full?.muSchema?.accounts || {}) },
      characters: { ...(full?.muSchema?.characters || {}) },
      membStat: { ...(full?.muSchema?.membStat || {}) },
      vip: { ...(full?.muSchema?.vip || {}) },
    },
    db: {
      host: full?.db?.host || '',
      port: full?.db?.port ?? 1433,
      user: full?.db?.user || '',
      password: '',
      database: full?.db?.database || '',
      database2: full?.db?.database2 || '',
      encrypt: Boolean(full?.db?.encrypt),
      trustServerCertificate: Boolean(full?.db?.trustServerCertificate),
    },
  };
}

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
  const [settingsMeta, setSettingsMeta] = useState(null);
  const [settingsSection, setSettingsSection] = useState('general');
  const [packs, setPacks] = useState([]);
  const [packForm, setPackForm] = useState({
    title: '',
    fiatCurrency: 'USD',
    price: 10,
    creditAmount: 1000,
    creditCurrency: 'wcoinc',
  });
  const [logs, setLogs] = useState([]);
  const [secrets, setSecrets] = useState(null);
  const [secretForm, setSecretForm] = useState({
    publicBaseUrl: '',
    mockMode: false,
    mpToken: '',
    mpWebhook: '',
    stripeSecret: '',
    stripeWebhook: '',
    stripePub: '',
    paypalEmail: '',
    paypalNotify: '',
    paypalReturn: '',
  });

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
          const res = await fetchAdminConfigFull();
          setSettingsMeta(res.data);
          setSettings(buildSettingsForm(res.data));
        }
        if (tab === 'donate') {
          const res = await fetchAdminDonationPackages();
          setPacks(res.data?.items || []);
        }
        if (tab === 'integrations') {
          const res = await fetchAdminSecrets();
          setSecrets(res.data);
          setSecretForm({
            publicBaseUrl: res.data?.donations?.publicBaseUrl || '',
            mockMode: Boolean(res.data?.donations?.mockMode),
            mpToken: '',
            mpWebhook: '',
            stripeSecret: '',
            stripeWebhook: '',
            stripePub: '',
            paypalEmail: res.data?.donations?.paypal?.email || '',
            paypalNotify: res.data?.donations?.paypal?.notifyUrl || '',
            paypalReturn: res.data?.donations?.paypal?.returnUrl || '',
          });
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
      const res = await saveAdminConfigFull({
        general: settings.general,
        features: settings.features,
        auth: settings.auth,
        tools: settings.tools,
        currencies: settings.currencies,
        rateLimit: settings.rateLimit,
        muSchema: settings.muSchema,
        db: settings.db,
      });
      setSettingsMeta(res.data);
      setSettings(buildSettingsForm(res.data));
      flash('CMS settings saved (live + .env). Reiniciá Node si cambiaste CORS / rate limits / DB.');
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

  const onSaveSecrets = async (e) => {
    e.preventDefault();
    try {
      const res = await saveAdminSecrets({
        donations: {
          publicBaseUrl: secretForm.publicBaseUrl,
          mockMode: secretForm.mockMode,
          mercadopago: {
            accessToken: secretForm.mpToken,
            webhookSecret: secretForm.mpWebhook,
          },
          stripe: {
            secretKey: secretForm.stripeSecret,
            webhookSecret: secretForm.stripeWebhook,
            publishableKey: secretForm.stripePub,
          },
          paypal: {
            email: secretForm.paypalEmail,
            notifyUrl: secretForm.paypalNotify,
            returnUrl: secretForm.paypalReturn,
          },
        },
      });
      setSecrets(res.data);
      setSecretForm((f) => ({
        ...f,
        mpToken: '',
        mpWebhook: '',
        stripeSecret: '',
        stripeWebhook: '',
        stripePub: '',
        publicBaseUrl: res.data?.donations?.publicBaseUrl || f.publicBaseUrl,
        mockMode: Boolean(res.data?.donations?.mockMode),
        paypalEmail: res.data?.donations?.paypal?.email || '',
        paypalNotify: res.data?.donations?.paypal?.notifyUrl || '',
        paypalReturn: res.data?.donations?.paypal?.returnUrl || '',
      }));
      flash('Integraciones guardadas (solo admin). Los botones Donate se actualizan al toque.');
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
              Las keys de MP / Stripe / PayPal se configuran en la pestaña{' '}
              <strong>Integrations</strong> (solo admin).
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

      {tab === 'integrations' && secrets && (
        <form className="cms-panel" onSubmit={onSaveSecrets}>
          <h2 className="admincp__h2">Integrations (Admin only)</h2>
          <p className="admincp__note">
            {secrets.note} Estado: MP{' '}
            {secrets.donations?.mercadopago?.accessToken?.set
              ? secrets.donations.mercadopago.accessToken.hint
              : 'sin configurar'}{' '}
            · Stripe{' '}
            {secrets.donations?.stripe?.secretKey?.set
              ? secrets.donations.stripe.secretKey.hint
              : 'sin configurar'}{' '}
            · PayPal {secrets.donations?.paypal?.email || 'sin email'}
          </p>
          <div className="cms-form" style={{ maxWidth: '100%' }}>
            <div className="cms-grid cms-grid--2">
              <label>
                Public site URL
                <input
                  value={secretForm.publicBaseUrl}
                  onChange={(e) => setSecretForm((f) => ({ ...f, publicBaseUrl: e.target.value }))}
                  placeholder="https://tudominio.com"
                />
              </label>
              <label>
                Mock donations
                <select
                  value={secretForm.mockMode ? 'true' : 'false'}
                  onChange={(e) =>
                    setSecretForm((f) => ({ ...f, mockMode: e.target.value === 'true' }))
                  }
                >
                  <option value="false">Off (live gateways)</option>
                  <option value="true">On (demo button)</option>
                </select>
              </label>
              <label>
                Mercado Pago Access Token
                <input
                  type="password"
                  autoComplete="off"
                  value={secretForm.mpToken}
                  onChange={(e) => setSecretForm((f) => ({ ...f, mpToken: e.target.value }))}
                  placeholder="dejar vacío = no cambiar"
                />
              </label>
              <label>
                Mercado Pago Webhook Secret
                <input
                  type="password"
                  autoComplete="off"
                  value={secretForm.mpWebhook}
                  onChange={(e) => setSecretForm((f) => ({ ...f, mpWebhook: e.target.value }))}
                  placeholder="dejar vacío = no cambiar"
                />
              </label>
              <label>
                Stripe Secret Key
                <input
                  type="password"
                  autoComplete="off"
                  value={secretForm.stripeSecret}
                  onChange={(e) => setSecretForm((f) => ({ ...f, stripeSecret: e.target.value }))}
                  placeholder="sk_..."
                />
              </label>
              <label>
                Stripe Webhook Secret
                <input
                  type="password"
                  autoComplete="off"
                  value={secretForm.stripeWebhook}
                  onChange={(e) => setSecretForm((f) => ({ ...f, stripeWebhook: e.target.value }))}
                  placeholder="whsec_..."
                />
              </label>
              <label>
                Stripe Publishable Key
                <input
                  value={secretForm.stripePub}
                  onChange={(e) => setSecretForm((f) => ({ ...f, stripePub: e.target.value }))}
                  placeholder="pk_..."
                />
              </label>
              <label>
                PayPal Email
                <input
                  value={secretForm.paypalEmail}
                  onChange={(e) => setSecretForm((f) => ({ ...f, paypalEmail: e.target.value }))}
                />
              </label>
              <label>
                PayPal Notify URL
                <input
                  value={secretForm.paypalNotify}
                  onChange={(e) => setSecretForm((f) => ({ ...f, paypalNotify: e.target.value }))}
                  placeholder="https://tudominio.com/api/donations/webhooks/paypal"
                />
              </label>
              <label>
                PayPal Return URL
                <input
                  value={secretForm.paypalReturn}
                  onChange={(e) => setSecretForm((f) => ({ ...f, paypalReturn: e.target.value }))}
                />
              </label>
            </div>
            <p className="admincp__note">
              Mapeos de monedas (credits / WCoinC / WCoinP / Goblin) → pestaña{' '}
              <strong>CMS Settings → Currencies</strong>.
            </p>
            <button type="submit" className="btn btn--primary" style={{ marginTop: '1rem' }}>
              Guardar integraciones
            </button>
          </div>
        </form>
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
          <h2 className="admincp__h2">CMS Settings</h2>
          <p className="admincp__note">
            Hosting: <strong>{settingsMeta?.hosting?.nodeEnv}</strong> · port{' '}
            <strong>{settingsMeta?.hosting?.port}</strong> · MU mode{' '}
            <strong>{settingsMeta?.hosting?.muDatabaseMode}</strong> (read-only). Storage:{' '}
            {settingsMeta?.storage || '—'}. Secretos vacíos = conservar.
          </p>
          <div className="cms-tabs admincp__subtabs">
            {SETTINGS_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={settingsSection === s.id ? 'is-active' : ''}
                onClick={() => setSettingsSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="cms-form" style={{ maxWidth: '100%' }}>
            {settingsSection === 'general' && (
              <>
                <h3 className="admincp__h3">Server public info</h3>
                <div className="cms-grid cms-grid--2">
                  {[
                    'name',
                    'season',
                    'exp',
                    'masterExp',
                    'drop',
                    'discordUrl',
                    'downloadUrl',
                    'instagramUrl',
                    'facebookUrl',
                  ].map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={settings.general.server?.[key] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            general: {
                              ...s.general,
                              server: { ...s.general.server, [key]: e.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  {['maxLevel', 'maxMasterLevel', 'resetLevel'].map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        type="number"
                        value={settings.general.server?.[key] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            general: {
                              ...s.general,
                              server: { ...s.general.server, [key]: e.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                  <label>
                    CORS_ORIGIN (comma-separated)
                    <input
                      value={settings.general.corsOrigin}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          general: { ...s.general, corsOrigin: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    TRUST_PROXY
                    <input
                      type="number"
                      value={settings.general.trustProxy}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          general: { ...s.general, trustProxy: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
                <p className="admincp__note">CORS requiere reinicio de Node para aplicar el middleware.</p>
              </>
            )}

            {settingsSection === 'features' && (
              <>
                <h3 className="admincp__h3">Feature flags</h3>
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
              </>
            )}

            {settingsSection === 'auth' && (
              <>
                <h3 className="admincp__h3">Hash &amp; admins</h3>
                <div className="cms-grid cms-grid--2">
                  <label>
                    HASH_METHOD
                    <select
                      value={settings.auth.hashMethod}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, hashMethod: e.target.value },
                        }))
                      }
                    >
                      <option value="plain">plain</option>
                      <option value="md5">md5</option>
                      <option value="wz_md5">wz_md5</option>
                      <option value="sha256">sha256</option>
                    </select>
                  </label>
                  <label>
                    SHA256_SALT{' '}
                    {settingsMeta?.auth?.sha256Salt?.set
                      ? `(${settingsMeta.auth.sha256Salt.hint})`
                      : '(vacío)'}
                    <input
                      type="password"
                      autoComplete="off"
                      value={settings.auth.sha256Salt}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, sha256Salt: e.target.value },
                        }))
                      }
                      placeholder="dejar vacío = no cambiar"
                    />
                  </label>
                  <label>
                    ADMIN_USERNAMES (comma-separated)
                    <input
                      value={settings.auth.adminUsernames}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, adminUsernames: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DEFAULT_SNO_NUMB
                    <input
                      value={settings.auth.registration.defaultSnoNumb}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: {
                            ...s.auth,
                            registration: {
                              ...s.auth.registration,
                              defaultSnoNumb: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                  <label>
                    INSERT_VI_CURR_INFO
                    <select
                      value={settings.auth.registration.insertViCurrInfo ? 'true' : 'false'}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: {
                            ...s.auth,
                            registration: {
                              ...s.auth.registration,
                              insertViCurrInfo: e.target.value === 'true',
                            },
                          },
                        }))
                      }
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    ALLOW_DUPLICATE_EMAILS
                    <select
                      value={settings.auth.registration.allowDuplicateEmails ? 'true' : 'false'}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: {
                            ...s.auth,
                            registration: {
                              ...s.auth.registration,
                              allowDuplicateEmails: e.target.value === 'true',
                            },
                          },
                        }))
                      }
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    JWT_EXPIRES_IN
                    <input
                      value={settings.auth.jwtExpiresIn}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, jwtExpiresIn: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    JWT_SECRET (rotar){' '}
                    {settingsMeta?.auth?.jwtSecret?.set
                      ? settingsMeta.auth.jwtSecret.hint
                      : ''}
                    <input
                      type="password"
                      autoComplete="off"
                      value={settings.auth.jwtSecret}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, jwtSecret: e.target.value },
                        }))
                      }
                      placeholder="vacío = no cambiar — invalida sesiones"
                    />
                  </label>
                  <label>
                    COOKIE_NAME
                    <input
                      value={settings.auth.cookieName}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, cookieName: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    COOKIE_SECURE
                    <select
                      value={settings.auth.cookieSecure ? 'true' : 'false'}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, cookieSecure: e.target.value === 'true' },
                        }))
                      }
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    COOKIE_SAME_SITE
                    <select
                      value={settings.auth.cookieSameSite}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          auth: { ...s.auth, cookieSameSite: e.target.value },
                        }))
                      }
                    >
                      <option value="lax">lax</option>
                      <option value="strict">strict</option>
                      <option value="none">none</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            {settingsSection === 'currencies' && (
              <>
                <h3 className="admincp__h3">Currency table mappings</h3>
                <p className="admincp__note">Tabla vacía = moneda deshabilitada / mock defaults.</p>
                {['credits', 'wcoinc', 'wcoinp', 'goblin'].map((cur) => (
                  <div key={cur} className="admincp__currency-block">
                    <h4 className="admincp__h4">{cur}</h4>
                    <div className="cms-grid cms-grid--3">
                      {['table', 'column', 'userColumn'].map((field) => (
                        <label key={field}>
                          {field}
                          <input
                            value={settings.currencies[cur]?.[field] ?? ''}
                            onChange={(e) =>
                              setSettings((s) => ({
                                ...s,
                                currencies: {
                                  ...s.currencies,
                                  [cur]: { ...s.currencies[cur], [field]: e.target.value },
                                },
                              }))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {settingsSection === 'tools' && (
              <>
                <h3 className="admincp__h3">Character tools defaults</h3>
                <div className="cms-grid cms-grid--2">
                  {[
                    ['unstuckMap', 'UNSTUCK_MAP'],
                    ['unstuckX', 'UNSTUCK_X'],
                    ['unstuckY', 'UNSTUCK_Y'],
                    ['clearPkLevel', 'CLEAR_PK_LEVEL'],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        value={settings.tools[key]}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            tools: { ...s.tools, [key]: e.target.value },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {settingsSection === 'security' && (
              <>
                <h3 className="admincp__h3">Rate limits</h3>
                <p className="admincp__note">
                  Se escriben a .env; el middleware de Express usa los valores al arrancar — reiniciá
                  Node para aplicar.
                </p>
                <div className="cms-grid cms-grid--2">
                  {[
                    ['windowMs', 'RATE_LIMIT_WINDOW_MS'],
                    ['max', 'RATE_LIMIT_MAX'],
                    ['authMax', 'AUTH_RATE_LIMIT_MAX'],
                    ['registerMax', 'REGISTER_RATE_LIMIT_MAX'],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        value={settings.rateLimit[key]}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            rateLimit: { ...s.rateLimit, [key]: e.target.value },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {settingsSection === 'schema' && (
              <>
                <h3 className="admincp__h3">MU Schema (advanced)</h3>
                <p className="admincp__note">
                  Solo si tu Season/DB usa nombres distintos. Valores incorrectos rompen login /
                  rankings.
                </p>
                <h4 className="admincp__h4">Accounts (MEMB_INFO)</h4>
                <div className="cms-grid cms-grid--2">
                  {Object.keys(settings.muSchema.accounts || {}).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={settings.muSchema.accounts[key] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            muSchema: {
                              ...s.muSchema,
                              accounts: { ...s.muSchema.accounts, [key]: e.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <h4 className="admincp__h4">Characters</h4>
                <div className="cms-grid cms-grid--2">
                  {Object.keys(settings.muSchema.characters || {}).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={settings.muSchema.characters[key] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            muSchema: {
                              ...s.muSchema,
                              characters: { ...s.muSchema.characters, [key]: e.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
                <h4 className="admincp__h4">VIP</h4>
                <div className="cms-grid cms-grid--2">
                  {Object.keys(settings.muSchema.vip || {}).map((key) => (
                    <label key={key}>
                      {key}
                      <input
                        value={settings.muSchema.vip[key] ?? ''}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            muSchema: {
                              ...s.muSchema,
                              vip: { ...s.muSchema.vip, [key]: e.target.value },
                            },
                          }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </>
            )}

            {settingsSection === 'db' && (
              <>
                <h3 className="admincp__h3">Database (advanced)</h3>
                <p className="admincp__note admincp__note--warn">
                  {settingsMeta?.db?.warning ||
                    'Cambiar DB_* puede romper la app. Reiniciá Node después.'}
                </p>
                <div className="cms-grid cms-grid--2">
                  <label>
                    DB_HOST
                    <input
                      value={settings.db.host}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, host: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DB_PORT
                    <input
                      type="number"
                      value={settings.db.port}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, port: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DB_USER
                    <input
                      value={settings.db.user}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, user: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DB_PASSWORD{' '}
                    {settingsMeta?.db?.password?.set ? settingsMeta.db.password.hint : '(vacío)'}
                    <input
                      type="password"
                      autoComplete="off"
                      value={settings.db.password}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, password: e.target.value },
                        }))
                      }
                      placeholder="dejar vacío = no cambiar"
                    />
                  </label>
                  <label>
                    DB_DATABASE
                    <input
                      value={settings.db.database}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, database: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DB_DATABASE_2
                    <input
                      value={settings.db.database2}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, database2: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label>
                    DB_ENCRYPT
                    <select
                      value={settings.db.encrypt ? 'true' : 'false'}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: { ...s.db, encrypt: e.target.value === 'true' },
                        }))
                      }
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                  <label>
                    DB_TRUST_CERT
                    <select
                      value={settings.db.trustServerCertificate ? 'true' : 'false'}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          db: {
                            ...s.db,
                            trustServerCertificate: e.target.value === 'true',
                          },
                        }))
                      }
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </label>
                </div>
              </>
            )}

            <button type="submit" className="btn btn--primary" style={{ marginTop: '1.25rem' }}>
              Save all settings
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
