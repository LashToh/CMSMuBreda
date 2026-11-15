import { useEffect, useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import Embers from '../Embers';
import { useGsapHero } from '../../hooks/useGsapReveal';
import { useTranslation } from '../../context/LanguageContext';
import { useRegister } from '../../context/RegisterContext';
import { fetchServerInfo } from '../../services/api';
import './Hero.scss';

// Season 6 portada: the logo and the call to play on the left, the mage of header art on the
// right, and right under it the live status of the server (the web bridge of the game server).
export default function Hero() {
  const sectionRef = useRef(null);
  useGsapHero(sectionRef);
  const { t } = useTranslation();
  const { openRegister } = useRegister();
  const [info, setInfo] = useState(null);
  const [status, setStatus] = useState({ loading: true, online: null, playersOnline: null });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchServerInfo();
        const data = res.data || {};
        const stats = data.stats || {};
        if (cancelled) return;
        setInfo(data);
        setStatus({
          loading: false,
          online: Boolean(stats.online) && !stats.unavailable,
          playersOnline: typeof stats.playersOnline === 'number' ? stats.playersOnline : null,
          accounts: stats.totalAccounts,
          characters: stats.totalCharacters,
        });
      } catch {
        if (!cancelled) setStatus({ loading: false, online: false, playersOnline: null });
      }
    };
    load();
    const timer = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');
  const facts = [
    info?.exp && { k: t('hero.factExp'), v: info.exp },
    info?.drop && { k: t('hero.factDrop'), v: info.drop },
    info?.maxLevel && { k: t('hero.factMaxLevel'), v: info.maxLevel },
    info?.resetLevel && { k: t('hero.factReset'), v: info.resetLevel },
  ].filter(Boolean);

  return (
    <section id="hero" className="hero" ref={sectionRef}>
      <div className="hero__bg" aria-hidden="true" />
      <Embers className="hero__embers" intensity={0.8} />

      <div className="hero__content">
        <img
          className="hero__brand"
          src="/assets/logo-2026.webp"
          srcSet="/assets/logo-2026-sm.webp 480w, /assets/logo-2026.webp 900w"
          sizes="(max-width: 600px) 320px, 460px"
          alt={t('common.logoAlt')}
          width={460}
          height={274}
          decoding="async"
          fetchpriority="high"
        />
        <h1 className="hero__title-line">{t('hero.tagline')}</h1>
        <p className="hero__subtitle">{t('hero.subtitle')}</p>
        <div className="hero__actions">
          <a href="#download" className="btn btn--primary btn--large">
            <FaDownload /> {t('hero.download')}
          </a>
          <button type="button" className="btn btn--steel btn--large" onClick={openRegister}>
            {t('hero.createAccount')}
          </button>
        </div>
        {facts.length > 0 && (
          <ul className="hero__facts">
            {facts.map((f) => (
              <li key={f.k}>
                {f.k} <b>{f.v}</b>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hero__status" aria-live="polite">
        <div className="hero__stat">
          <span className="hero__stat-k">{t('hero.statServer')}</span>
          <span
            className={`hero__stat-v hero__pill ${
              status.loading ? 'is-loading' : status.online ? 'is-online' : 'is-offline'
            }`}
          >
            {status.loading
              ? t('hero.serverChecking')
              : status.online
                ? t('hero.statOnline')
                : t('hero.statOffline')}
          </span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-k">{t('hero.statPlaying')}</span>
          <span className="hero__stat-v">
            {status.online ? fmt(status.playersOnline) : '0'} <small>{t('hero.statPlayers')}</small>
          </span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-k">{t('hero.statAccounts')}</span>
          <span className="hero__stat-v">{fmt(status.accounts)}</span>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-k">{t('hero.statCharacters')}</span>
          <span className="hero__stat-v">{fmt(status.characters)}</span>
        </div>
      </div>
    </section>
  );
}
