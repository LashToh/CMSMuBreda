import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
import { useTranslation } from '../../context/LanguageContext';
import './InfoMenu.scss';

/** Options of the "Info" submenu (shared by the landing navbar, its mobile menu and the CMS shell). */
export const INFO_ITEMS = [
  { key: 'aboutGeneral', to: '/about' },
  { key: 'guides', to: '/guides' },
];

export function isInfoPath(pathname) {
  return INFO_ITEMS.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`));
}

/** Desktop dropdown: button + list of links. Opens with click / Enter / Space / ArrowDown. */
export default function InfoMenu() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const focusFirst = useRef(false);
  const panelId = useId();
  const active = isInfoPath(pathname);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Move focus to the first link when opened with the keyboard (ArrowDown).
  useEffect(() => {
    if (open && focusFirst.current) {
      focusFirst.current = false;
      rootRef.current?.querySelector('.info-menu__link')?.focus();
    }
  }, [open]);

  const links = () => Array.from(rootRef.current?.querySelectorAll('.info-menu__link') || []);

  const onButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (open) {
        links()[0]?.focus();
      } else {
        focusFirst.current = true;
        setOpen(true);
      }
    }
  };

  const onPanelKeyDown = (event) => {
    const items = links();
    const idx = items.indexOf(document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (idx <= 0) buttonRef.current?.focus();
      else items[idx - 1]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const onRootKeyDown = (event) => {
    if (event.key === 'Escape' && open) {
      event.stopPropagation();
      close(true);
    }
  };

  const onRootBlur = (event) => {
    if (open && rootRef.current && !rootRef.current.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div className="info-menu" ref={rootRef} onKeyDown={onRootKeyDown} onBlur={onRootBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={`info-menu__trigger${active ? ' is-active' : ''}${open ? ' is-open' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
      >
        {t('nav.about')}
        <FaChevronDown className="info-menu__caret" aria-hidden="true" />
      </button>
      {open && (
        <ul id={panelId} className="info-menu__panel" onKeyDown={onPanelKeyDown}>
          {INFO_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end
                className={({ isActive }) => `info-menu__link${isActive ? ' is-active' : ''}`}
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
