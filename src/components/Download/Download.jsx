import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaDiscord, FaUserPlus } from 'react-icons/fa';
import Embers from '../Embers';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { useRegister } from '../../context/RegisterContext';
import { useTranslation } from '../../context/LanguageContext';
import './Download.scss';

const DOWNLOAD_URL = import.meta.env.VITE_DOWNLOAD_URL || '#';
const DISCORD_URL = import.meta.env.VITE_DISCORD_URL || '#';

export default function Download() {
  const { openRegister } = useRegister();
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  useGsapReveal(contentRef, { y: 80, duration: 1 });
  const { t } = useTranslation();

  return (
    <section id="download" className="download" ref={sectionRef}>
      <Embers intensity={0.6} />
      <div className="download__bg">
        <div className="download__bg-glow" />
      </div>

      <div className="download__inner" ref={contentRef}>
        <span className="section-label">{t('download.sectionLabel')}</span>
        <h2 className="download__title">
          {t('download.titleLine1')}<br />{t('download.titleLine2')}
        </h2>
        <div className="divider" />
        <p className="download__subtitle">{t('download.subtitle')}</p>

        <div className="download__actions">
          <motion.a
            href={DOWNLOAD_URL}
            className="btn btn--primary btn--large download__btn-main"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            target={DOWNLOAD_URL.startsWith('http') ? '_blank' : undefined}
            rel={DOWNLOAD_URL.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            <FaDownload /> {t('download.downloadClient')}
          </motion.a>

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
