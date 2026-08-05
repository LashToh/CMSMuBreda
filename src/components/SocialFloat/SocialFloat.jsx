import { FaDiscord, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { SOCIAL_LINKS } from '../../data/socialLinks';
import { useTranslation } from '../../context/LanguageContext';
import './SocialFloat.scss';

const ICONS = {
  discord: FaDiscord,
  instagram: FaInstagram,
  facebook: FaFacebookF,
};

export default function SocialFloat() {
  const { t } = useTranslation();

  return (
    <aside className="social-float" aria-label={t('social.ariaLabel')}>
      <ul className="social-float__list">
        {SOCIAL_LINKS.map(({ id, href }) => {
          const Icon = ICONS[id];
          if (!Icon) return null;

          return (
            <li key={id}>
              <a
                href={href}
                className={`social-float__link social-float__link--${id}`}
                aria-label={t(`social.${id}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon aria-hidden="true" />
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
