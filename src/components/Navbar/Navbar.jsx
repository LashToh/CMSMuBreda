import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { useRegister } from '../../context/RegisterContext';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import './Navbar.scss';

const CMS_LINKS = [
  { key: 'home', to: '/' },
  { key: 'rankings', to: '/rankings' },
  { key: 'news', to: '/news' },
  { key: 'donate', to: '/donate' },
  { key: 'downloads', to: '/downloads' },
];

export default function Navbar() {
  const { openRegister } = useRegister();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNav = (href) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <nav className="navbar__inner">
        <div className="navbar__brand">
          <Link
            to="/"
            className="navbar__logo"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label={t('nav.home')}
          >
            <picture>
              <source srcSet="/assets/logo-mubreda.webp" type="image/webp" />
              <img
                src="/assets/logo-mubreda.png"
                alt={t('common.logoAlt')}
                className="navbar__logo-img"
                width={224}
                height={224}
                decoding="async"
              />
            </picture>
          </Link>
        </div>

        <ul className="navbar__links">
          {CMS_LINKS.map((link) => (
            <li key={link.to}>
              <Link to={link.to}>{t(`nav.${link.key}`)}</Link>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <Link to="/account">{t('nav.account')}</Link>
            </li>
          )}
        </ul>

        <div className="navbar__actions">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <>
              <Link to="/account" className="btn btn--secondary navbar__register">
                {user?.username || t('nav.account')}
              </Link>
              <button type="button" className="btn btn--primary navbar__cta" onClick={() => logout()}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--secondary navbar__register">
                {t('nav.login')}
              </Link>
              <button type="button" className="btn btn--primary navbar__cta" onClick={openRegister}>
                {t('nav.register')}
              </button>
            </>
          )}
        </div>

        <button
          className="navbar__toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
        >
          {menuOpen ? <HiX /> : <HiMenuAlt3 />}
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar__mobile"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <LanguageSwitcher className="navbar__mobile-lang" />
            <ul className="navbar__mobile-links">
              {CMS_LINKS.map((link, i) => (
                <motion.li
                  key={link.to}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link to={link.to} onClick={closeMenu}>
                    {t(`nav.${link.key}`)}
                  </Link>
                </motion.li>
              ))}
              {isAuthenticated && (
                <motion.li
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: CMS_LINKS.length * 0.06 }}
                >
                  <Link to="/account" onClick={closeMenu}>
                    {t('nav.account')}
                  </Link>
                </motion.li>
              )}
            </ul>
            {isAuthenticated ? (
              <>
                <Link to="/account" className="btn btn--secondary btn--large" onClick={closeMenu}>
                  {user?.username || t('nav.account')}
                </Link>
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={() => { closeMenu(); logout(); }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn--secondary btn--large" onClick={closeMenu}>
                  {t('nav.login')}
                </Link>
                <button
                  type="button"
                  className="btn btn--primary btn--large"
                  onClick={() => { closeMenu(); openRegister(); }}
                >
                  {t('nav.register')}
                </button>
              </>
            )}
            <a href="#download" className="navbar__mobile-play" onClick={(e) => { e.preventDefault(); handleNav('#download'); }}>
              {t('nav.playNow')}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
