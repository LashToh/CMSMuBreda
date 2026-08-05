import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { ApiError } from '../services/api';

/** Only allow same-origin relative paths (open-redirect safe). */
function safeRedirect(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null;
  return trimmed;
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(
    () => safeRedirect(searchParams.get('redirect') || searchParams.get('next')) || '/account',
    [searchParams],
  );

  if (!loading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="cms-page">
      <p className="cms-page__label">{t('login.label')}</p>
      <h1 className="cms-page__title">{t('login.title')}</h1>
      <p className="cms-page__subtitle">{t('login.subtitle')}</p>

      <div className="cms-panel">
        {error && <div className="cms-alert cms-alert--error">{error}</div>}
        <form className="cms-form" onSubmit={onSubmit}>
          <label>
            {t('login.username')}
            <input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              required
            />
          </label>
          <label>
            {t('login.password')}
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
        <p style={{ marginTop: '1.25rem', opacity: 0.75 }}>
          {t('login.noAccount')} <Link to="/register">{t('login.register')}</Link>
        </p>
      </div>
    </section>
  );
}
