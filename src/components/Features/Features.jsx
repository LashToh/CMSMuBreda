import { useTranslation } from '../../context/LanguageContext';
import './Features.scss';

// What only Breda has: one card per system of the server (texts in i18n: features.items).
const ITEMS = [
  { id: 'arkaWar', image: '/assets/features/arka-war.webp' },
  { id: 'battlePass', image: '/assets/features/battle-pass.webp' },
  { id: 'quests', image: '/assets/features/quests.webp' },
  { id: 'party', image: '/assets/features/party.webp' },
  { id: 'minimap', image: '/assets/features/minimap.webp' },
  { id: 'jewelBank', image: '/assets/features/jewel-bank.webp' },
];

export default function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="features">
      <div className="features__head">
        <h2 className="features__title">{t('features.title')}</h2>
        <p className="features__subtitle">{t('features.subtitle')}</p>
      </div>
      <div className="features__grid">
        {ITEMS.map((item) => (
          <article key={item.id} className="features__card">
            <div className="features__pic" style={{ backgroundImage: `url(${item.image})` }}>
              <span className="features__tag">{t(`features.items.${item.id}.tag`)}</span>
            </div>
            <div className="features__body">
              <h3>{t(`features.items.${item.id}.title`)}</h3>
              <p>{t(`features.items.${item.id}.text`)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
