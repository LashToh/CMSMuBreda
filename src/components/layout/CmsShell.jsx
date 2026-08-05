import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import './CmsShell.scss';

const LINKS = [
  { to: '/', key: 'home', end: true },
  { to: '/news', key: 'news' },
  { to: '/rankings', key: 'rankings' },
  { to: '/donate', key: 'donate' },
  { to: '/downloads', key: 'downloads' },
];

export default function CmsShell() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="cms-shell">
      <header className="cms-shell__header">
        <div className="cms-shell__inner">
          <Link to="/" className="cms-shell__brand" aria-label={t('nav.home')}>
            <img src="/assets/logo-mubreda.webp" alt={t('common.logoAlt')} width={48} height={48} />
            <span>MU Breda</span>
          </Link>

          <nav className="cms-shell__nav">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                {t(`nav.${link.key}`)}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink to="/account" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {t('nav.account')}
              </NavLink>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="cms-shell__actions">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <span className="cms-shell__user">{user.username}</span>
                <button type="button" className="btn btn--secondary" onClick={() => logout()}>
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--secondary">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn btn--primary">
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="cms-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
