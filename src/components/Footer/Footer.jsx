import { FaDiscord, FaTwitter, FaYoutube, FaFacebookF } from 'react-icons/fa';
import LanguageSwitcher from '../LanguageSwitcher';
import { useTranslation } from '../../context/LanguageContext';
import './Footer.scss';

const SOCIAL = [
  { icon: FaDiscord, key: 'discord', href: '#' },
  { icon: FaTwitter, key: 'twitter', href: '#' },
  { icon: FaYoutube, key: 'youtube', href: '#' },
  { icon: FaFacebookF, key: 'facebook', href: '#' },
];

const FOOTER_GROUPS = ['game', 'community', 'legal'];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo-row">
              <div className="footer__logo">
                <picture>
                  <source srcSet="/assets/logo-mubreda.webp" type="image/webp" />
                  <img
                    src="/assets/logo-mubreda.png"
                    alt={t('common.logoAlt')}
                    className="footer__logo-img"
                    width={240}
                    height={240}
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
              </div>
              <p className="footer__brand-name">{t('footer.brandName')}</p>
            </div>
            <p className="footer__tagline">{t('footer.tagline')}</p>
            <div className="footer__social">
              {SOCIAL.map(({ icon: Icon, key, href }) => (
                <a key={key} href={href} aria-label={t(`footer.social.${key}`)} className="footer__social-link">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <div className="footer__links">
            {FOOTER_GROUPS.map((groupKey) => {
              const group = t(`footer.groups.${groupKey}`);
              return (
                <div key={groupKey} className="footer__link-group">
                  <h4>{group.title}</h4>
                  <ul>
                    {group.links.map((link) => (
                      <li key={link}>
                        <a href="#">{link}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__bottom-row">
            <p>{t('footer.copyright')}</p>
            <LanguageSwitcher compact className="footer__lang" />
          </div>
          <p className="footer__disclaimer">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
