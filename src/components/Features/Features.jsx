import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  GiCrossedSwords,
  GiCastle,
  GiTreasureMap,
  GiShield,
  GiCrystalGrowth,
  GiDragonHead,
} from 'react-icons/gi';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { SEASON21_FEATURES } from '../../data/crusaderData';
import { useTranslation } from '../../context/LanguageContext';
import './Features.scss';

const ICON_MAP = {
  GiCrossedSwords,
  GiCastle,
  GiTreasureMap,
  GiShield,
  GiCrystalGrowth,
  GiDragonHead,
};

export default function Features() {
  const headerRef = useRef(null);
  const gridRef = useRef(null);
  useGsapReveal(headerRef);
  useGsapReveal(gridRef, { children: true, stagger: 0.1 });
  const { t } = useTranslation();

  return (
    <section id="features" className="features">
      <div className="features__inner">
        <div className="section-header" ref={headerRef}>
          <span className="section-label">{t('features.sectionLabel')}</span>
          <h2 className="section-title">{t('features.title')}</h2>
          <div className="divider" />
          <p className="section-subtitle">{t('features.subtitle')}</p>
        </div>

        <div className="features__grid" ref={gridRef}>
          {SEASON21_FEATURES.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon];
            return (
              <motion.div
                key={feature.id}
                className="features__card glass-card"
                whileHover={{ scale: 1.03, y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <div className="features__card-icon">
                  <Icon />
                </div>
                <h3 className="features__card-title">{t(`features.items.${feature.id}.title`)}</h3>
                <p className="features__card-desc">{t(`features.items.${feature.id}.description`)}</p>
                <span className="features__card-number">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
