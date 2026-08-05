import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ApiError,
  completeMockDonation,
  fetchDonationPackages,
  startDonationCheckout,
} from '../services/api';

const PROVIDER_LABELS = {
  mercadopago: 'Mercado Pago',
  stripe: 'Stripe',
  paypal: 'PayPal',
  mock: 'Demo (mock)',
};

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
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const [packages, setPackages] = useState([]);
  const [providers, setProviders] = useState({});
  const [mockMode, setMockMode] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const statusHint = useMemo(() => {
    const status = searchParams.get('status');
    if (status === 'success') return 'Pago recibido. El WCoinC se acredita automáticamente por webhook.';
    if (status === 'cancel') return 'Pago cancelado.';
    if (status === 'paypal') return 'Retorno de PayPal. La acreditación llega por IPN (puede demorar unos segundos).';
    return '';
  }, [searchParams]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDonationPackages();
      setPackages(res.data?.items || []);
      setProviders(res.data?.providers || {});
      setMockMode(Boolean(res.data?.mockMode));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Donaciones temporalmente no disponibles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCheckout = async (pack, provider) => {
    setMsg('');
    setError('');
    setBusyId(`${pack.id}:${provider}`);
    try {
      const res = await startDonationCheckout({ packageId: pack.id, provider });
      const data = res.data || {};

      if (data.mode === 'mock') {
        const done = await completeMockDonation(data.transactionId);
        setMsg(done.message || `Acreditados ${pack.creditAmount} WCoinC (demo).`);
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

      setMsg(res.message || 'Checkout creado.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar la donación.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="cms-page">
      <p className="cms-page__label">Support</p>
      <h1 className="cms-page__title">Donate</h1>
      <p className="cms-page__subtitle">
        Apoyá MU Breda Season 21. Los paquetes acreditan WCoinC automáticamente al confirmarse el
        pago (Mercado Pago, Stripe o PayPal).
      </p>

      {mockMode && (
        <div className="cms-alert cms-alert--info">
          Modo demo activo (`DONATIONS_MOCK` / mock DB): el botón Demo acredita WCoinC sin pasarela
          real.
        </div>
      )}

      {statusHint && <div className="cms-alert cms-alert--info">{statusHint}</div>}
      {error && <div className="cms-alert cms-alert--error">{error}</div>}
      {msg && <div className="cms-alert cms-alert--info">{msg}</div>}

      {loading ? (
        <div className="cms-loading">Cargando paquetes…</div>
      ) : packages.length === 0 ? (
        <div className="cms-panel">No hay paquetes disponibles.</div>
      ) : (
        <div className="cms-grid cms-grid--3">
          {packages.map((pack) => (
            <article key={pack.id} className="cms-panel">
              <h3 style={{ fontFamily: 'Cinzel, serif', color: '#f0d08a' }}>{pack.title}</h3>
              <p style={{ opacity: 0.8, margin: '0.75rem 0 1rem' }}>{pack.description}</p>
              <p style={{ fontFamily: 'Cinzel, serif' }}>
                {pack.fiatCurrency} {Number(pack.price).toLocaleString()} →{' '}
                {Number(pack.creditAmount).toLocaleString()} {String(pack.creditCurrency).toUpperCase()}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                {isAuthenticated ? (
                  (pack.providers || []).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      className={provider === 'mock' ? 'btn btn--secondary' : 'btn btn--primary'}
                      disabled={Boolean(busyId)}
                      onClick={() => onCheckout(pack, provider)}
                    >
                      {busyId === `${pack.id}:${provider}`
                        ? 'Procesando…'
                        : PROVIDER_LABELS[provider] || provider}
                    </button>
                  ))
                ) : (
                  <Link to="/login" className="btn btn--secondary">
                    Login to donate
                  </Link>
                )}
              </div>
              {!isAuthenticated ? null : (pack.providers || []).length === 0 ? (
                <p style={{ opacity: 0.7, marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  Ningún proveedor configurado para este paquete.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}

      <div className="cms-panel" style={{ marginTop: '1.5rem' }}>
        <p style={{ margin: 0, opacity: 0.75 }}>
          Webhooks:{' '}
          <code>/api/donations/webhooks/mercadopago</code>,{' '}
          <code>/api/donations/webhooks/stripe</code>,{' '}
          <code>/api/donations/webhooks/paypal</code>
          {providers?.mercadopago || providers?.stripe || providers?.paypal
            ? ` · MP ${providers.mercadopago?.configured ? 'OK' : '—'} · Stripe ${
                providers.stripe?.configured ? 'OK' : '—'
              } · PayPal ${providers.paypal?.configured ? 'OK' : '—'}`
            : null}
        </p>
      </div>
    </section>
  );
}
