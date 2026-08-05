import { useRef } from 'react';
import { FaDownload } from 'react-icons/fa';
import Embers from '../Embers';
import { useGsapHero } from '../../hooks/useGsapReveal';
import { useParallax } from '../../hooks/useParallax';
import { useTranslation } from '../../context/LanguageContext';
import './Hero.scss';

export default function Hero() {
  const sectionRef = useRef(null);
  const bgRef = useParallax(0.03);
  useGsapHero(sectionRef);
  const { t } = useTranslation();

  return (
    <section id="hero" className="hero" ref={sectionRef}>
      <div className="hero__bg" ref={bgRef}>
        <div className="hero__bg-gradient" />
        <div className="hero__bg-vignette" />
        <div className="hero__fog hero__fog--1" />
        <div className="hero__fog hero__fog--2" />
      </div>

      <Embers intensity={1.2} />

      <div className="hero__content">
        <div className="hero__text">
          <div className="hero__brand-block">
            <h1 className="hero__brand">{t('hero.brand')}</h1>
          </div>
          <div className="hero__title">
            <span className="hero__title-line">{t('hero.season')}</span>
            <span className="hero__title-line hero__title-line--accent">{t('hero.titleAccent')}</span>
          </div>
          <p className="hero__subtitle">{t('hero.subtitle')}</p>
          <div className="hero__actions">
            <a href="#download" className="btn btn--primary btn--large">
              <FaDownload /> {t('hero.download')}
            </a>
          </div>
        </div>
      </div>

      <div className="hero__scroll">
        <span>{t('hero.scroll')}</span>
        <div className="hero__scroll-line" />
      </div>
    </section>
  );
}
