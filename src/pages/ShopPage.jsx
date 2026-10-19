import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import {
  calculateWcoinc,
  currencyForProvider,
} from '../data/donationRates';
import {
  ApiError,
  completeMockDonation,
  fetchDonationPackages,
  startDonationCheckout,
} from '../services/api';

const PENDING_DONATION_KEY = 'mubreda-pending-donation';
const CUSTOM_METHODS = ['mercadopago', 'astropay', 'paypal'];

function normalizeProviders(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['mercadopago', 'astropay', 'paypal'].map((id) => ({
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
  const [providerStatus, setProviderStatus] = useState({});
  const [customMeta, setCustomMeta] = useState(null);
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [highlightId, setHighlightId] = useState('');
  const [customProvider, setCustomProvider] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const resumeTried = useRef(false);

  const customCurrency = customProvider
    ? currencyForProvider(customProvider) ||
      customMeta?.providerCurrency?.[customProvider] ||
      ''
    : '';

  const quote = useMemo(
    () => calculateWcoinc(customAmount, customCurrency, customMeta || {}),
    [customAmount, customCurrency, customMeta],
  );

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
      setProviderStatus(res.data?.providers || {});
      setCustomMeta(res.data?.custom || null);
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
    async (payload, creditHint) => {
      setMsg('');
      setError('');
      const busyKey = payload.packageId
        ? `${payload.packageId}:${payload.provider}`
        : `custom:${payload.provider}`;
      setBusyId(busyKey);
      try {
        const res = await startDonationCheckout(payload);
        const data = res.data || {};
        const credited = data.creditAmount ?? creditHint;

        if (data.mode === 'mock') {
          const done = await completeMockDonation(data.transactionId);
          setMsg(
            done.message ||
              t('donate.mockCredited', {
                amount: Number(credited || 0).toLocaleString(),
              }),
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
    runCheckout({ packageId: pack.id, provider: providerId }, pack.creditAmount);
  };

  const onCustomPay = () => {
    if (!customProvider || !customCurrency || quote.creditAmount <= 0) return;

    const status = providerStatus[customProvider];
    if (!status?.enabled) {
      setError(
        status?.reason
          ? t(`donate.reasons.${status.reason}`)
          : t('donate.checkoutFailed'),
      );
      return;
    }

    if (!isAuthenticated) {
      savePendingDonation({
        custom: true,
        provider: customProvider,
        amount: Number(customAmount),
        fiatCurrency: customCurrency,
      });
      navigate(`/login?redirect=${encodeURIComponent('/donate')}`);
      return;
    }

    runCheckout(
      {
        provider: customProvider,
        amount: Number(customAmount),
        fiatCurrency: customCurrency,
      },
      quote.creditAmount,
    );
  };

  useEffect(() => {
    if (authLoading || loading || !isAuthenticated || resumeTried.current) return;

    const pending = takePendingDonation();
    if (!pending?.provider) return;

    resumeTried.current = true;
    setMsg(t('donate.resume'));

    if (pending.custom) {
      setCustomProvider(pending.provider);
      setCustomAmount(String(pending.amount || ''));
      const status = providerStatus[pending.provider];
      if (status?.enabled) {
        runCheckout(
          {
            provider: pending.provider,
            amount: Number(pending.amount),
            fiatCurrency: pending.fiatCurrency,
          },
          null,
        );
      } else {
        setError(
          status?.reason
            ? t(`donate.reasons.${status.reason}`)
            : t('donate.checkoutFailed'),
        );
      }
      return;
    }

    if (!pending.packageId || packages.length === 0) return;
    const pack = packages.find((p) => p.id === pending.packageId);
    if (!pack) return;

    setHighlightId(pack.id);
    const entry = normalizeProviders(pack.providers).find((p) => p.id === pending.provider);
    if (entry?.enabled) {
      runCheckout({ packageId: pack.id, provider: pending.provider }, pack.creditAmount);
    } else {
      setError(
        entry?.reason
          ? t(`donate.reasons.${entry.reason}`)
          : t('donate.checkoutFailed'),
      );
    }
  }, [
    authLoading,
    loading,
    isAuthenticated,
    packages,
    providerStatus,
    runCheckout,
    t,
  ]);

  const customBusy = busyId.startsWith('custom:');

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
      ) : (
        <>
          <div className="cms-panel" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a', marginTop: 0 }}>
              {t('donate.customTitle')}
            </h2>
            <p style={{ opacity: 0.8, marginBottom: '1rem' }}>{t('donate.customHint')}</p>

            <div className="cms-form" style={{ maxWidth: 480 }}>
              <label>
                {t('donate.customMethod')}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginTop: '0.35rem',
                  }}
                >
                  {CUSTOM_METHODS.map((id) => {
                    const status = providerStatus[id] || {
                      enabled: false,
                      reason: 'not_configured',
                    };
                    const selected = customProvider === id;
                    const unavailable = !status.enabled;
                    return (
                      <button
                        key={id}
                        type="button"
                        className={selected ? 'btn btn--primary' : 'btn btn--secondary'}
                        disabled={unavailable}
                        title={
                          unavailable && status.reason
                            ? t(`donate.reasons.${status.reason}`)
                            : undefined
                        }
                        onClick={() => {
                          setCustomProvider(id);
                          setError('');
                        }}
                        style={unavailable ? { opacity: 0.55 } : undefined}
                      >
                        {t(`donate.providers.${id}`)}
                        {unavailable
                          ? ` — ${t(`donate.reasons.${status.reason || 'not_configured'}`)}`
                          : ''}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label>
                {t('donate.customCurrency')}
                <input
                  value={customCurrency || '—'}
                  disabled
                  readOnly
                />
              </label>

              <label>
                {t('donate.customAmount')}
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="decimal"
                  disabled={!customProvider}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={
                    customCurrency === 'ARS'
                      ? t('donate.customAmountPlaceholderArs')
                      : customCurrency === 'USD'
                        ? t('donate.customAmountPlaceholderUsd')
                        : t('donate.customAmountPlaceholder')
                  }
                />
              </label>

              <div
                style={{
                  margin: '0.5rem 0 1rem',
                  fontFamily: 'Cinzel, serif',
                  color: '#f0d08a',
                }}
              >
                {customProvider && quote.creditAmount > 0 ? (
                  <>
                    <div>
                      {t('donate.customYouGet', {
                        amount: quote.creditAmount.toLocaleString(),
                      })}
                    </div>
                    {quote.bonusApplied ? (
                      <div style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '0.35rem' }}>
                        {t('donate.customBonus', {
                          base: quote.baseAmount.toLocaleString(),
                          bonus: quote.bonusAmount.toLocaleString(),
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.85rem', opacity: 0.65, marginTop: '0.35rem' }}>
                        {t('donate.customRates')}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ opacity: 0.65, fontFamily: 'inherit' }}>
                    {t('donate.customPreviewEmpty')}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn--primary"
                disabled={
                  !customProvider ||
                  quote.creditAmount <= 0 ||
                  Boolean(busyId) ||
                  !providerStatus[customProvider]?.enabled
                }
                onClick={onCustomPay}
              >
                {customBusy ? t('donate.processing') : t('donate.customPay')}
              </button>
            </div>
          </div>

          <h2
            style={{
              fontFamily: 'Cinzel, serif',
              color: '#f0d08a',
              marginBottom: '1rem',
            }}
          >
            {t('donate.packagesTitle')}
          </h2>

          {packages.length === 0 ? (
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
                            className={
                              provider.id === 'mock' ? 'btn btn--secondary' : 'btn btn--primary'
                            }
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
        </>
      )}
    </section>
  );
}
