import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaTimes, FaExpand } from 'react-icons/fa';
import { useGsapReveal } from '../../hooks/useGsapReveal';
import { GALLERY_ITEMS } from '../../data/crusaderData';
import { useTranslation } from '../../context/LanguageContext';
import './Gallery.scss';

function Lightbox({ item, onClose, t }) {
  if (!item) return null;
  const title = t(`gallery.items.${item.id}.title`);

  return (
    <motion.div
      className="gallery__lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="gallery__lightbox-content"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="gallery__lightbox-close" onClick={onClose} aria-label={t('gallery.close')}>
          <FaTimes />
        </button>
        <div
          className="gallery__lightbox-visual"
          style={{ background: item.gradient }}
        >
          {item.type === 'video' ? (
            <div className="gallery__lightbox-play">
              <FaPlay />
              <span>{t('gallery.videoPreview')}</span>
            </div>
          ) : (
            <div className="gallery__lightbox-placeholder">
              <span>{title}</span>
            </div>
          )}
        </div>
        <h3 className="gallery__lightbox-title">{title}</h3>
      </motion.div>
    </motion.div>
  );
}

export default function Gallery() {
  const headerRef = useRef(null);
  const [activeItem, setActiveItem] = useState(null);
  useGsapReveal(headerRef);
  const { t } = useTranslation();

  return (
    <section id="gallery" className="gallery">
      <div className="gallery__inner">
        <div className="section-header" ref={headerRef}>
          <span className="section-label">{t('gallery.sectionLabel')}</span>
          <h2 className="section-title">{t('gallery.title')}</h2>
          <div className="divider" />
          <p className="section-subtitle">{t('gallery.subtitle')}</p>
        </div>

        <div className="gallery__grid">
          {GALLERY_ITEMS.map((item, i) => (
            <motion.div
              key={item.id}
              className={`gallery__item gallery__item--${item.type}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActiveItem(item)}
            >
              <div className="gallery__item-visual" style={{ background: item.gradient }}>
                {item.type === 'video' && (
                  <div className="gallery__item-play">
                    <FaPlay />
                  </div>
                )}
              </div>
              <div className="gallery__item-overlay">
                <span className="gallery__item-title">{t(`gallery.items.${item.id}.title`)}</span>
                <FaExpand className="gallery__item-expand" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeItem && (
          <Lightbox item={activeItem} onClose={() => setActiveItem(null)} t={t} />
        )}
      </AnimatePresence>
    </section>
  );
}
