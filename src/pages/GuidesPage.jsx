import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaBook, FaChevronDown } from 'react-icons/fa';
import { ApiError, fetchGuides } from '../services/api';
import { useTranslation } from '../context/LanguageContext';
import renderMarkdown from '../utils/miniMarkdown';
import { looksLikeHtml, sanitizeGuideHtml } from '../utils/guideHtml';
import { GUIDE_ICON_COMPONENTS } from '../utils/guideIcons';
import './GuidesPage.scss';

function pickText(value, lang) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.es || value.en || value.pt || '';
}

/** Rich text: sanitized HTML, or legacy markdown rendered with the mini markdown renderer. */
function RichContent({ source, className = '' }) {
  const html = useMemo(
    () => (looksLikeHtml(source) ? sanitizeGuideHtml(source) : null),
    [source],
  );
  if (html === null) {
    return <div className={`guides-md ${className}`}>{renderMarkdown(source)}</div>;
  }
  return (
    <div
      className={`guides-md guides-md--html ${className}`}
      // Sanitized with DOMPurify (allowlist) just above.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function readHash() {
  try {
    return decodeURIComponent(window.location.hash.replace(/^#/, ''));
  } catch {
    return '';
  }
}

function setHash(id) {
  try {
    const { pathname, search } = window.location;
    window.history.replaceState(window.history.state, '', id ? `${pathname}${search}#${encodeURIComponent(id)}` : `${pathname}${search}`);
  } catch {
    /* ignore (sandboxed / old browsers) */
  }
}

const DESKTOP_QUERY = '(min-width: 1025px)';

export default function GuidesPage() {
  const { t, locale } = useTranslation();
  const lang = locale || 'es';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState(() => new Set());
  // Id of the guide shown on the right; '' = the introduction (data.intro).
  const [activeId, setActiveId] = useState('');
  const menuRef = useRef(null);
  const contentRef = useRef(null);

  const categories = useMemo(() => data?.categories || [], [data]);
  const intro = pickText(data?.intro, lang);

  const active = useMemo(() => {
    for (const cat of categories) {
      const item = (cat.items || []).find((i) => i.id === activeId);
      if (item) return { cat, item };
    }
    return null;
  }, [categories, activeId]);

  // Opens the category/guide named by the URL hash. Returns true if the hash matched something.
  const applyHash = useCallback((cats) => {
    const hash = readHash();
    if (!hash) return false;
    for (const cat of cats) {
      if (cat.id === hash) {
        setOpenCats((prev) => new Set(prev).add(cat.id));
        return true;
      }
      if ((cat.items || []).some((item) => item.id === hash)) {
        setOpenCats((prev) => new Set(prev).add(cat.id));
        setActiveId(hash);
        return true;
      }
    }
    return false;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchGuides();
        if (cancelled) return;
        const cats = res.data?.categories || [];
        setData(res.data);
        if (!applyHash(cats) && cats.length > 0) {
          // Default: first section open; intro on the right, or else its first guide.
          const first = cats[0];
          setOpenCats(new Set([first.id]));
          const hasIntro = Boolean(pickText(res.data?.intro, lang));
          if (!hasIntro && (first.items || []).length > 0) setActiveId(first.items[0].id);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError && err.message ? err.message : 'load');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // The guides are fetched once; the language only picks which text is shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyHash]);

  // Follow manual hash changes (pasted links, back/forward).
  useEffect(() => {
    const onHash = () => applyHash(categories);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [applyHash, categories]);

  const toggleCat = (id) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectItem = (id) => {
    setActiveId(id);
    setHash(id);
    // On narrow screens the content sits below the menu: bring it into view.
    const wide = window.matchMedia?.(DESKTOP_QUERY).matches;
    if (!wide) {
      window.setTimeout(() => {
        const el = contentRef.current;
        if (!el) return;
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }, 60);
    }
  };

  // Arrow / Home / End move focus between buttons of the same level.
  const onKeyDown = (event) => {
    const el = event.target;
    const group = el?.dataset?.nav;
    if (!group || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const list = Array.from(menuRef.current?.querySelectorAll(`[data-nav="${group}"]`) || []);
    const idx = list.indexOf(el);
    if (idx < 0) return;
    let target = null;
    if (event.key === 'ArrowDown') target = list[Math.min(idx + 1, list.length - 1)];
    if (event.key === 'ArrowUp') target = list[Math.max(idx - 1, 0)];
    if (event.key === 'Home') target = list[0];
    if (event.key === 'End') target = list[list.length - 1];
    event.preventDefault();
    target?.focus();
  };

  return (
    <section className="cms-page guides-page">
      <p className="cms-page__label">{t('guides.label')}</p>
      <h1 className="cms-page__title">{t('guides.title')}</h1>
      <p className="cms-page__subtitle">{t('guides.subtitle')}</p>

      {loading && <div className="cms-loading">{t('guides.loading')}</div>}
      {error && (
        <div className="cms-alert cms-alert--error">
          {error === 'load' ? t('guides.loadError') : error}
        </div>
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="guides-layout">
          <nav
            className="cms-panel guides-page__menu"
            aria-label={t('guides.menuLabel')}
            ref={menuRef}
            onKeyDown={onKeyDown}
          >
            {categories.map((cat) => {
              const catOpen = openCats.has(cat.id);
              const hasActive = active?.cat.id === cat.id;
              const Icon = GUIDE_ICON_COMPONENTS[cat.icon] || FaBook;
              const panelId = `guide-cat-panel-${cat.id}`;
              const headId = `guide-cat-${cat.id}`;
              return (
                <div
                  key={cat.id}
                  className={`guides-cat${catOpen ? ' is-open' : ''}${hasActive ? ' has-active' : ''}`}
                >
                  <h2 className="guides-cat__heading">
                    <button
                      type="button"
                      id={headId}
                      className="guides-cat__button"
                      data-nav="cat"
                      aria-expanded={catOpen}
                      aria-controls={panelId}
                      onClick={() => toggleCat(cat.id)}
                    >
                      <Icon className="guides-cat__icon" aria-hidden="true" />
                      <span className="guides-cat__title">{pickText(cat.title, lang)}</span>
                      <FaChevronDown className="guides-chevron" aria-hidden="true" />
                    </button>
                  </h2>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={headId}
                    className={`guides-collapse${catOpen ? ' is-open' : ''}`}
                  >
                    <div className="guides-collapse__inner">
                      <ul className="guides-items">
                        {(cat.items || []).map((item) => {
                          const isActive = item.id === activeId;
                          return (
                            <li key={item.id} className={`guides-item${isActive ? ' is-active' : ''}`}>
                              <button
                                type="button"
                                id={`guide-item-btn-${item.id}`}
                                className="guides-item__button"
                                data-nav={`item-${cat.id}`}
                                aria-current={isActive ? 'true' : undefined}
                                aria-controls="guide-content"
                                onClick={() => selectItem(item.id)}
                              >
                                <span className="guides-item__title">{pickText(item.title, lang)}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <article
            id="guide-content"
            className="cms-panel guides-page__content"
            ref={contentRef}
            aria-live="polite"
          >
            {active ? (
              <>
                <p className="guides-page__crumb">{pickText(active.cat.title, lang)}</p>
                <h2 className="guides-page__guide-title">{pickText(active.item.title, lang)}</h2>
                <RichContent source={pickText(active.item.body, lang)} />
              </>
            ) : intro ? (
              <RichContent source={intro} className="guides-page__intro" />
            ) : (
              <p className="guides-page__hint">{t('guides.pickHint')}</p>
            )}
          </article>
        </div>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="cms-empty">{t('guides.empty')}</div>
      )}
    </section>
  );
}
