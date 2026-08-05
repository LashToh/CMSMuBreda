import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { WEAPONS } from '../../data/crusaderData';
import { useTranslation } from '../../context/LanguageContext';
import './Weapons.scss';

function getTierStats(weaponType, tier, t) {
  if (weaponType === 'hammer') {
    return [
      { label: t('weapons.stats.damage'), value: `${tier.damageMin}–${tier.damageMax}` },
      { label: t('weapons.stats.attackSpeed'), value: tier.attackSpeed },
      { label: t('weapons.stats.requirements'), value: tier.requirements },
    ];
  }

  return [
    { label: t('weapons.stats.defense'), value: tier.defense },
    { label: t('weapons.stats.defenseRate'), value: tier.defenseRate },
    { label: t('weapons.stats.requirements'), value: tier.requirements },
  ];
}

function TierStrip({ tiers, activeIndex, onSelect, t }) {
  return (
    <div className="weapons__tiers">
      <span className="weapons__tiers-label">{t('weapons.fullTierLine')}</span>
      <div className="weapons__tiers-scroll">
        {tiers.map((tier, i) => (
          <button
            key={tier.name}
            type="button"
            className={`weapons__tier ${i === activeIndex ? 'weapons__tier--active' : ''}`}
            onClick={() => onSelect(i)}
            title={tier.name}
            aria-pressed={i === activeIndex}
          >
            <span className="weapons__tier-thumb">
              <img src={tier.image} alt={tier.name} loading="lazy" />
            </span>
            <span className="weapons__tier-name">{tier.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WeaponCard({ weapon, index, t }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [activeTier, setActiveTier] = useState(weapon.tiers.length - 1);
  const cardRef = useRef(null);
  const tier = weapon.tiers[activeTier];
  const stats = getTierStats(weapon.weaponType, tier, t);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <motion.div
      ref={cardRef}
      className={`weapons__card weapons__card--${weapon.align}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
      }}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.2, duration: 0.8 }}
    >
      <div className="weapons__card-inner">
        <div className="weapons__card-visual">
          <div className="weapons__card-visual-frame">
            <img src={tier.image} alt={tier.name} loading="lazy" />
          </div>
        </div>
        <div className="weapons__card-content">
          <span className="weapons__card-subtitle">{t(`weapons.items.${weapon.id}.subtitle`)}</span>
          <h3 className="weapons__card-title">{tier.name}</h3>
          <p className="weapons__card-desc">{t(`weapons.items.${weapon.id}.description`)}</p>
          <dl className="weapons__card-stats">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`weapons__stat ${stat.highlight ? 'weapons__stat--highlight' : ''}`}
              >
                <dt>{stat.label}</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
          <TierStrip
            tiers={weapon.tiers}
            activeIndex={activeTier}
            onSelect={setActiveTier}
            t={t}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function Weapons() {
  const headerRef = useRef(null);
  useGsapReveal(headerRef);
  const { t } = useTranslation();

  return (
    <section id="weapons" className="weapons">
      <div className="weapons__inner">
        <div className="section-header" ref={headerRef}>
          <span className="section-label">{t('weapons.sectionLabel')}</span>
          <h2 className="section-title">{t('weapons.title')}</h2>
          <div className="divider" />
          <p className="section-subtitle">{t('weapons.subtitle')}</p>
        </div>

        <div className="weapons__grid">
          {WEAPONS.map((weapon, i) => (
            <WeaponCard key={weapon.id} weapon={weapon} index={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
