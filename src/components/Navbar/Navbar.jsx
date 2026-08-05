import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import { useRegister } from '../../context/RegisterContext';
import { useTranslation } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import LanguageSwitcher from '../LanguageSwitcher';
import './Navbar.scss';

const NAV_LINKS = [
  { key: 'crusader', href: '#crusader' },
  { key: 'arsenal', href: '#weapons' },
  { key: 'skills', href: '#skills' },
  { key: 'features', href: '#features' },
  { key: 'timeline', href: '#timeline' },
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

  return (
    <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <nav className="navbar__inner">
        <div className="navbar__brand">
          <a href="#hero" className="navbar__logo" onClick={(e) => { e.preventDefault(); handleNav('#hero'); }}>
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
          </a>
        </div>

        <ul className="navbar__links">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={(e) => { e.preventDefault(); handleNav(link.href); }}>
                {t(`nav.${link.key}`)}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar__actions">
          <LanguageSwitcher />
          <Link to="/rankings" className="navbar__cms-link">
            Rankings
          </Link>
          <Link to="/news" className="navbar__cms-link">
            News
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/account" className="btn btn--secondary navbar__register">
                {user?.username || 'Account'}
              </Link>
              <button type="button" className="btn btn--primary navbar__cta" onClick={() => logout()}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--secondary navbar__register">
                Login
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
              {NAV_LINKS.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <a href={link.href} onClick={(e) => { e.preventDefault(); handleNav(link.href); }}>
                    {t(`nav.${link.key}`)}
                  </a>
                </motion.li>
              ))}
            </ul>
            <button type="button" className="btn btn--secondary btn--large" onClick={() => { setMenuOpen(false); openRegister(); }}>
              {t('nav.register')}
            </button>
            <a href="#download" className="btn btn--primary btn--large" onClick={(e) => { e.preventDefault(); handleNav('#download'); }}>
              {t('nav.playNow')}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
