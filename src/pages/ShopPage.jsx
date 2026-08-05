import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import {
  ApiError,
  completeMockDonation,
  fetchDonationPackages,
  startDonationCheckout,
} from '../services/api';

const PENDING_DONATION_KEY = 'mubreda-pending-donation';

function normalizeProviders(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['mercadopago', 'stripe', 'paypal'].map((id) => ({
      id,
      enabled: false,
      configured: false,
      reason: 'not_configured',
    }));
  }
  return raw.map((entry) => {
    if (typeof entry === 'string') {
      return { id: entry, enabled: true, configured: true, reason: null };
    }
    return {
      id: entry.id,
      enabled: Boolean(entry.enabled),
      configured: Boolean(entry.configured),
      reason: entry.reason || null,
    };
  });
}

function savePendingDonation(intent) {
  try {
    sessionStorage.setItem(PENDING_DONATION_KEY, JSON.stringify(intent));
  } catch {
    /* ignore */
  }
}

function takePendingDonation() {
  try {
    const raw = sessionStorage.getItem(PENDING_DONATION_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_DONATION_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function postPaypalForm(action, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  Object.entries(fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export default function ShopPage() {
  const { t } = useTranslation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [providers, setProviders] = useState({});
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [highlightId, setHighlightId] = useState('');
  const resumeTried = useRef(false);

  const statusHint = useMemo(() => {
    const status = searchParams.get('status');
    if (status === 'success') return t('donate.statusSuccess');
    if (status === 'cancel') return t('donate.statusCancel');
    if (status === 'paypal') return t('donate.statusPaypal');
    return '';
  }, [searchParams, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDonationPackages();
      setPackages(res.data?.items || []);
      setProviders(res.data?.providers || {});
      setMockMode(Boolean(res.data?.mockMode));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('donate.unavailable'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const runCheckout = useCallback(
    async (pack, providerId) => {
      setMsg('');
      setError('');
      setBusyId(`${pack.id}:${providerId}`);
      try {
        const res = await startDonationCheckout({ packageId: pack.id, provider: providerId });
        const data = res.data || {};

        if (data.mode === 'mock') {
          const done = await completeMockDonation(data.transactionId);
          setMsg(
            done.message ||
              t('donate.mockCredited', { amount: Number(pack.creditAmount).toLocaleString() }),
          );
          return;
        }

        if (data.mode === 'redirect' && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        if (data.mode === 'form_post' && data.action && data.fields) {
          postPaypalForm(data.action, data.fields);
          return;
        }

        setMsg(res.message || t('donate.checkoutCreated'));
      } catch (err) {
        setError(err instanceof ApiError ? err.message : t('donate.checkoutFailed'));
      } finally {
        setBusyId('');
      }
    },
    [t],
  );

  const onProviderClick = (pack, provider) => {
    const providerId = provider.id;

    if (!isAuthenticated) {
      savePendingDonation({ packageId: pack.id, provider: providerId });
      navigate(
        `/login?redirect=${encodeURIComponent('/donate')}&package=${encodeURIComponent(pack.id)}&provider=${encodeURIComponent(providerId)}`,
      );
      return;
    }

    if (!provider.enabled) return;
    runCheckout(pack, providerId);
  };

  useEffect(() => {
    if (authLoading || loading || !isAuthenticated || resumeTried.current) return;
    if (packages.length === 0) return;

    const pending = takePendingDonation();
    if (!pending?.packageId || !pending?.provider) return;

    resumeTried.current = true;
    const pack = packages.find((p) => p.id === pending.packageId);
    if (!pack) return;

    setHighlightId(pack.id);
    setMsg(t('donate.resume'));

    const entry = normalizeProviders(pack.providers).find((p) => p.id === pending.provider);
    if (entry?.enabled) {
      runCheckout(pack, pending.provider);
    } else {
      setError(
        entry?.reason
          ? t(`donate.reasons.${entry.reason}`)
          : t('donate.checkoutFailed'),
      );
    }
  }, [authLoading, loading, isAuthenticated, packages, runCheckout, t]);

  return (
    <section className="cms-page">
      <p className="cms-page__label">{t('donate.label')}</p>
      <h1 className="cms-page__title">{t('donate.title')}</h1>
      <p className="cms-page__subtitle">{t('donate.subtitle')}</p>

      {!isAuthenticated && !authLoading && (
        <div className="cms-alert cms-alert--info">{t('donate.loginHint')}</div>
      )}

      {mockMode && <div className="cms-alert cms-alert--info">{t('donate.mockBanner')}</div>}

      {statusHint && <div className="cms-alert cms-alert--info">{statusHint}</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      {loading ? (
        <div className="cms-loading">{t('donate.loading')}</div>
      ) : packages.length === 0 ? (
        <div className="cms-panel">{t('donate.empty')}</div>
      ) : (
        <div className="cms-grid cms-grid--3">
          {packages.map((pack) => {
            const packProviders = normalizeProviders(pack.providers);
            const highlighted = highlightId === pack.id;
            return (
              <article
                key={pack.id}
                className="cms-panel"
                style={highlighted ? { outline: '1px solid #f0d08a' } : undefined}
              >
                <h3 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a' }}>{pack.title}</h3>
                <p style={{ opacity: 0.8, margin: '0.75rem 0 1rem' }}>{pack.description}</p>
                <p style={{ fontFamily: 'Cinzel, serif' }}>
                  {pack.fiatCurrency} {Number(pack.price).toLocaleString()} →{' '}
                  {Number(pack.creditAmount).toLocaleString()}{' '}
                  {String(pack.creditCurrency).toUpperCase()}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    marginTop: '1rem',
                  }}
                >
                  {packProviders.map((provider) => {
                    const busy = busyId === `${pack.id}:${provider.id}`;
                    const label = t(`donate.providers.${provider.id}`) || provider.id;
                    const reasonLabel = provider.reason
                      ? t(`donate.reasons.${provider.reason}`)
                      : '';
                    const unavailable = !provider.enabled;

                    return (
                      <button
                        key={provider.id}
                        type="button"
                        className={provider.id === 'mock' ? 'btn btn--secondary' : 'btn btn--primary'}
                        disabled={Boolean(busyId) || unavailable}
                        title={unavailable && reasonLabel ? reasonLabel : undefined}
                        onClick={() => {
                          if (unavailable) return;
                          onProviderClick(pack, provider);
                        }}
                        style={
                          unavailable ? { opacity: 0.55, cursor: 'not-allowed' } : undefined
                        }
                      >
                        {busy
                          ? t('donate.processing')
                          : unavailable && reasonLabel
                            ? `${label} — ${reasonLabel}`
                            : label}
                      </button>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="cms-panel" style={{ marginTop: '1.5rem' }}>
        <p style={{ margin: 0, opacity: 0.75 }}>
          {t('donate.webhooks')}:{' '}
          <code>/api/donations/webhooks/mercadopago</code>,{' '}
          <code>/api/donations/webhooks/stripe</code>,{' '}
          <code>/api/donations/webhooks/paypal</code>
          {providers?.mercadopago || providers?.stripe || providers?.paypal
            ? ` · MP ${
                providers.mercadopago?.configured ? t('donate.statusOk') : t('donate.statusMissing')
              } · Stripe ${
                providers.stripe?.configured ? t('donate.statusOk') : t('donate.statusMissing')
              } · PayPal ${
                providers.paypal?.configured ? t('donate.statusOk') : t('donate.statusMissing')
              }`
            : null}
        </p>
      </div>
    </section>
  );
}
