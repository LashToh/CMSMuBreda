import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import LanguageSwitcher from '../LanguageSwitcher';
import './CmsShell.scss';

const LINKS = [
  { to: '/rankings', label: 'Rankings' },
  { to: '/news', label: 'News' },
  { to: '/donate', label: 'Donate' },
  { to: '/downloads', label: 'Downloads' },
];

export default function CmsShell() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="cms-shell">
      <header className="cms-shell__header">
        <div className="cms-shell__inner">
          <Link to="/" className="cms-shell__brand">
            <img src="/assets/logo-mubreda.webp" alt={t('common.logoAlt')} width={48} height={48} />
            <span>MU Breda</span>
          </Link>

          <nav className="cms-shell__nav">
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'is-active' : '')}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated && (
              <NavLink to="/account" className={({ isActive }) => (isActive ? 'is-active' : '')}>
                Account
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
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn--primary">
                  Register
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
