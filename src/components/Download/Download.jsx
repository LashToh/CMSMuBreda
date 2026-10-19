import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaDiscord, FaUserPlus } from 'react-icons/fa';
import Embers from '../Embers';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useRegister } from '../../context/RegisterContext';
import { useTranslation } from '../../context/LanguageContext';
import { fetchDownloads } from '../../services/api';
import { mirrorsWithUrls } from '../../data/downloadMirrors';
import './Download.scss';

const FALLBACK_URL = import.meta.env.VITE_DOWNLOAD_URL || '';
const DISCORD_URL = import.meta.env.VITE_DISCORD_URL || '#';

export default function Download() {
  const { openRegister } = useRegister();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  useGsapReveal(contentRef, { y: 80, duration: 1 });
  const { t } = useTranslation();
  const [mirrors, setMirrors] = useState(() =>
    FALLBACK_URL ? [{ id: 'direct', label: 'Direct Download', url: FALLBACK_URL }] : [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchDownloads();
        const items = res.data?.items || [];
        const client =
          items.find((d) => d.type === 'client') ||
          items.find((d) => mirrorsWithUrls(d).length) ||
          null;
        if (!client || cancelled) return;
        const list = mirrorsWithUrls(client, { fallbackSize: client.size || '' });
        if (list.length) setMirrors(list);
      } catch {
        /* keep fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const primary = mirrors.find((m) => m.id === 'direct') || mirrors[0] || null;
  const others = mirrors.filter((m) => m !== primary);

  return (
    <section id="download" className="download" ref={sectionRef}>
      <Embers intensity={0.6} />
      <div className="download__bg">
        <div className="download__bg-glow" />
      </div>

      <div className="download__inner" ref={contentRef}>
        <span className="section-label">{t('download.sectionLabel')}</span>
        <h2 className="download__title">
          {t('download.titleLine1')}
          <br />
          {t('download.titleLine2')}
        </h2>
        <div className="divider" />
        <p className="download__subtitle">{t('download.subtitle')}</p>

        <div className="download__actions">
          {primary ? (
            <motion.a
              href={primary.url}
              className="btn btn--primary btn--large download__btn-main"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaDownload /> {t('download.downloadClient')}
            </motion.a>
          ) : (
            <a href="/downloads" className="btn btn--primary btn--large download__btn-main">
              <FaDownload /> {t('download.downloadClient')}
            </a>
          )}

          {others.length > 0 && (
            <div className="download__mirrors">
              <p className="download__mirrors-label">{t('download.mirrorsLabel')}</p>
              <div className="download__mirrors-list">
                {others.map((m) => (
                  <a
                    key={m.id}
                    href={m.url}
                    className="btn btn--secondary download__mirror-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                    title={[m.description, m.size].filter(Boolean).join(' · ') || m.label}
                  >
                    <FaDownload /> {m.label}
                    {m.size ? <span className="download__mirror-size">{m.size}</span> : null}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="download__secondary">
            <button type="button" className="btn btn--secondary" onClick={openRegister}>
              <FaUserPlus /> {t('download.registerAccount')}
            </button>
            <a
              href={DISCORD_URL}
              className="btn btn--ghost"
              target={DISCORD_URL.startsWith('http') ? '_blank' : undefined}
              rel={DISCORD_URL.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              <FaDiscord /> {t('download.joinDiscord')}
            </a>
          </div>
        </div>

        <div className="download__requirements glass-card">
          <h3>{t('download.systemRequirements')}</h3>
          <div className="download__req-grid">
            <div>
              <h4>{t('download.minimum')}</h4>
              <ul>
                <li>{t('download.req.osMin')}</li>
                <li>{t('download.req.cpuMin')}</li>
                <li>{t('download.req.ramMin')}</li>
                <li>{t('download.req.gpuMin')}</li>
                <li>{t('download.req.storageMin')}</li>
              </ul>
            </div>
            <div>
              <h4>{t('download.recommended')}</h4>
              <ul>
                <li>{t('download.req.osRec')}</li>
                <li>{t('download.req.cpuRec')}</li>
                <li>{t('download.req.ramRec')}</li>
                <li>{t('download.req.gpuRec')}</li>
                <li>{t('download.req.storageRec')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
