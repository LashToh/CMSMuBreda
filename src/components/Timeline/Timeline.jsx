import { useRef } from 'react';

import { motion } from 'framer-motion';

import { useGsapReveal } from '../../hooks/useGsapReveal';

import { TIMELINE } from '../../data/crusaderData';

import { useTranslation } from '../../context/LanguageContext';

import './Timeline.scss';



export default function Timeline() {

  const headerRef = useRef(null);

  const lineRef = useRef(null);

  useGsapReveal(headerRef);

  useGsapReveal(lineRef, { children: true, stagger: 0.15, y: 40 });

  const { t } = useTranslation();



  return (

    <section id="timeline" className="timeline">

      <div className="timeline__bg" />

      <div className="timeline__inner">

        <div className="section-header" ref={headerRef}>

          <span className="section-label">{t('timeline.sectionLabel')}</span>

          <h2 className="section-title">{t('timeline.title')}</h2>

          <div className="divider" />

          <p className="section-subtitle">{t('timeline.subtitle')}</p>

        </div>



        <div className="timeline__track" ref={lineRef}>

          <div className="timeline__line" aria-hidden="true" />



          {TIMELINE.map((event) => {

            const label = t(`timeline.items.${event.id}.label`);

            return (

              <motion.div

                key={event.id}

                className={`timeline__event ${event.active ? 'timeline__event--active' : ''}`}

              >

                <div className="timeline__dot">

                  {event.active && <div className="timeline__dot-pulse" />}

                </div>

                <div className="timeline__card glass-card">

                  {label && (

                    <span

                      className={`timeline__label${event.id === 'official-launch' ? ' timeline__label--tba' : ''}`}

                    >

                      {label}

                    </span>

                  )}

                  <h3 className="timeline__title">{t(`timeline.items.${event.id}.title`)}</h3>

                  <p className="timeline__desc">{t(`timeline.items.${event.id}.description`)}</p>

                  {event.active && (

                    <span className="timeline__badge">{t('timeline.current')}</span>

                  )}

                </div>

              </motion.div>

            );

          })}

        </div>

      </div>

    </section>

  );

}

