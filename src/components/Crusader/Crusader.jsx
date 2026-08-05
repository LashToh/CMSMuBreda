import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { CRUSADER } from '../../data/crusaderData';
import { useTranslation } from '../../context/LanguageContext';
import './Crusader.scss';

export default function Crusader() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);
  useGsapReveal(contentRef, { children: true, stagger: 0.15 });
  const { t } = useTranslation();
  const lore = t('crusader.lore');

  const statPercent = (value, max) => Math.round((value / max) * 100);

  return (
    <section id="crusader" className="crusader" ref={sectionRef}>
      <div className="crusader__bg">
        <div className="crusader__bg-light" />
      </div>

      <div className="crusader__inner">
        <div className="crusader__visual" ref={contentRef}>
          <div className="crusader__frame">
            <div className="crusader__frame-glow" />
            <img
              src="/assets/crusader-official.png"
              alt={t('crusader.portraitAlt')}
              className="crusader__portrait"
              loading="lazy"
            />
          </div>
          <div className="crusader__badge">
            <span>{t('crusader.badge')}</span>
          </div>
        </div>

        <div className="crusader__info">
          <span className="section-label">{t('crusader.sectionLabel')}</span>
          <h2 className="section-title">{t('crusader.title')}</h2>
          <div className="divider divider--left" />

          {Array.isArray(lore) && lore.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="crusader__lore">
              {paragraph}
            </p>
          ))}

          <p className="crusader__meta">
            <strong>{t('crusader.roleLabel')}:</strong> {t('crusader.role')}<br />
            <strong>{t('crusader.weaponsLabel')}:</strong> {t('crusader.baseInfo.weapons')}<br />
            <strong>{t('crusader.exclusiveStatLabel')}:</strong> {t('crusader.baseInfo.holyAttack')}<br />
            <strong>{t('crusader.buffSkillLabel')}:</strong> {t('crusader.baseInfo.buffSkill')}
          </p>

          <div className="crusader__stats">
            {CRUSADER.stats.map((stat, i) => (
              <motion.div
                key={stat.key}
                className="crusader__stat glass-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
              >
                <span className="crusader__stat-icon">{stat.icon}</span>
                <div className="crusader__stat-info">
                  <span className="crusader__stat-label">{t(`crusader.stats.${stat.key}`)}</span>
                  <div className="crusader__stat-bar">
                    <motion.div
                      className="crusader__stat-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${statPercent(stat.value, stat.max)}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="crusader__stat-value">{stat.value}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
