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

export default function GuidesPage() {
  const { t, locale } = useTranslation();
  const lang = locale || 'es';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [openCats, setOpenCats] = useState(() => new Set());
  const [openItems, setOpenItems] = useState(() => new Set());
  const rootRef = useRef(null);
  const scrollTarget = useRef('');

  const categories = useMemo(() => data?.categories || [], [data]);

  // Open the category/item named by the URL hash and schedule a scroll to it.
  const applyHash = useCallback(
    (cats) => {
      const hash = readHash();
      if (!hash) return;
      for (const cat of cats) {
        if (cat.id === hash) {
          setOpenCats((prev) => new Set(prev).add(cat.id));
          scrollTarget.current = `guide-cat-${cat.id}`;
          return;
        }
        if ((cat.items || []).some((item) => item.id === hash)) {
          setOpenCats((prev) => new Set(prev).add(cat.id));
          setOpenItems((prev) => new Set(prev).add(hash));
          scrollTarget.current = `guide-item-${hash}`;
          return;
        }
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchGuides();
        if (!cancelled) {
          setData(res.data);
          applyHash(res.data?.categories || []);
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
  }, [applyHash]);

  // Follow manual hash changes (pasted links, back/forward).
  useEffect(() => {
    const onHash = () => applyHash(categories);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [applyHash, categories]);

  // Scroll once the DOM reflects the opened state.
  useEffect(() => {
    if (!scrollTarget.current || loading) return undefined;
    const id = scrollTarget.current;
    scrollTarget.current = '';
    const timer = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [openCats, openItems, loading]);

  const toggleCat = (id) => {
    setOpenCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItem = (id) => {
    const opening = !openItems.has(id);
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (opening) next.add(id);
      else next.delete(id);
      return next;
    });
    if (opening) setHash(id);
    else if (readHash() === id) setHash('');
  };

  const allOpen = categories.length > 0 && categories.every((c) => openCats.has(c.id));

  const toggleAll = () => {
    if (allOpen) {
      setOpenCats(new Set());
      setOpenItems(new Set());
      setHash('');
    } else {
      setOpenCats(new Set(categories.map((c) => c.id)));
      setOpenItems(new Set(categories.flatMap((c) => (c.items || []).map((i) => i.id))));
    }
  };

  // Arrow / Home / End move focus between headers of the same level.
  const onKeyDown = (event) => {
    const el = event.target;
    const group = el?.dataset?.nav;
    if (!group || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const list = Array.from(rootRef.current?.querySelectorAll(`[data-nav="${group}"]`) || []);
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
        <>
          {pickText(data?.intro, lang) && (
            <RichContent source={pickText(data.intro, lang)} className="guides-page__intro" />
          )}
          <div className="guides-page__toolbar">
            <button type="button" className="btn btn--secondary guides-page__toggle-all" onClick={toggleAll}>
              {allOpen ? t('guides.collapseAll') : t('guides.expandAll')}
            </button>
          </div>

          <div className="cms-panel guides-page__panel" ref={rootRef} onKeyDown={onKeyDown}>
            {categories.map((cat) => {
              const catOpen = openCats.has(cat.id);
              const Icon = GUIDE_ICON_COMPONENTS[cat.icon] || FaBook;
              const panelId = `guide-cat-panel-${cat.id}`;
              const headId = `guide-cat-${cat.id}`;
              return (
                <div key={cat.id} className={`guides-cat${catOpen ? ' is-open' : ''}`}>
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
                          const itemOpen = openItems.has(item.id);
                          const bodyId = `guide-item-panel-${item.id}`;
                          const itemHeadId = `guide-item-btn-${item.id}`;
                          return (
                            <li
                              key={item.id}
                              id={`guide-item-${item.id}`}
                              className={`guides-item${itemOpen ? ' is-open' : ''}`}
                            >
                              <h3 className="guides-item__heading">
                                <button
                                  type="button"
                                  id={itemHeadId}
                                  className="guides-item__button"
                                  data-nav={`item-${cat.id}`}
                                  aria-expanded={itemOpen}
                                  aria-controls={bodyId}
                                  onClick={() => toggleItem(item.id)}
                                >
                                  <span className="guides-item__title">{pickText(item.title, lang)}</span>
                                  <span className="guides-item__badge" aria-hidden="true">
                                    <FaChevronDown className="guides-chevron guides-chevron--sm" />
                                  </span>
                                </button>
                              </h3>
                              <div
                                id={bodyId}
                                role="region"
                                aria-labelledby={itemHeadId}
                                className={`guides-collapse${itemOpen ? ' is-open' : ''}`}
                              >
                                <div className="guides-collapse__inner">
                                  <RichContent source={pickText(item.body, lang)} />
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && categories.length === 0 && (
        <div className="cms-empty">{t('guides.empty')}</div>
      )}
    </section>
  );
}
