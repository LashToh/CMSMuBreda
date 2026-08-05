import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { SKILLS } from '../../data/crusaderData';
import { useTranslation } from '../../context/LanguageContext';
import './Skills.scss';

function SkillCard({ skill, index, t }) {
  return (
    <motion.div
      className="skills__card glass-card"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.6 }}
    >
      <div className="skills__card-header">
        <div className="skills__card-icon">
          <img src={skill.image} alt="" loading="lazy" width={28} height={40} />
        </div>
        <span className="skills__card-type">{t(`skills.types.${skill.typeKey}`)}</span>
      </div>
      <h3 className="skills__card-name">{skill.name}</h3>
      <p className="skills__card-req">{skill.requirement}</p>
      <p className="skills__card-desc">{t(`skills.items.${skill.id}.description`)}</p>
      {skill.previewImage && (
        <div className="skills__card-preview">
          <img
            className="skills__card-preview-img"
            src={skill.previewImage}
            alt={t('skills.previewAlt', { name: skill.name })}
            loading="lazy"
          />
        </div>
      )}
    </motion.div>
  );
}

export default function Skills() {
  const headerRef = useRef(null);
  useGsapReveal(headerRef);
  const { t } = useTranslation();

  return (
    <section id="skills" className="skills">
      <div className="skills__bg" />
      <div className="skills__inner">
        <div className="section-header" ref={headerRef}>
          <span className="section-label">{t('skills.sectionLabel')}</span>
          <h2 className="section-title">{t('skills.title')}</h2>
          <div className="divider" />
          <p className="section-subtitle">{t('skills.subtitle')}</p>
        </div>

        <div className="skills__grid">
          {SKILLS.map((skill, i) => (
            <SkillCard key={skill.id} skill={skill} index={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
