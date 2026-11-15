import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { cloneGuidesDefaults, GUIDE_ICONS } from '../data/guidesDefaults.js';
import { sanitizeGuideHtml } from './guidesSanitize.js';

function normalizeText(value, fallback = '') {
  if (value && typeof value === 'object') {
    return {
      es: String(value.es ?? fallback ?? ''),
      en: String(value.en || value.es || fallback || ''),
      pt: String(value.pt || value.en || value.es || fallback || ''),
    };
  }
  const t = value == null ? String(fallback ?? '') : String(value);
  return { es: t, en: t, pt: t };
}

function normalizeGuides(raw) {
  const base = cloneGuidesDefaults();
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.categories)) return base;
  return {
    updatedAt: raw.updatedAt || null,
    intro: normalizeText(raw.intro, base.intro.es),
    categories: raw.categories
      .filter((c) => c && c.id)
      .map((c) => ({
        id: String(c.id),
        icon: GUIDE_ICONS.includes(c.icon) ? c.icon : GUIDE_ICONS[0],
        title: normalizeText(c.title, c.id),
        items: Array.isArray(c.items)
          ? c.items
              .filter((i) => i && i.id)
              .map((i) => ({
                id: String(i.id),
                title: normalizeText(i.title, i.id),
                body: normalizeText(i.body, ''),
              }))
          : [],
      })),
  };
}

function countItems(guides) {
  return guides.categories.reduce((n, c) => n + c.items.length, 0);
}

export function getGuides() {
  return normalizeGuides(readStore().guides);
}

/** Rich text (intro and item bodies) is stored as sanitized HTML. Titles stay plain text. */
function sanitizeGuides(guides) {
  const clean = (text) => ({
    es: sanitizeGuideHtml(text.es),
    en: sanitizeGuideHtml(text.en),
    pt: sanitizeGuideHtml(text.pt),
  });
  guides.intro = clean(guides.intro);
  for (const cat of guides.categories) {
    for (const it of cat.items) it.body = clean(it.body);
  }
  return guides;
}

export function saveGuides(payload, actor) {
  const guides = sanitizeGuides(normalizeGuides(payload));
  guides.updatedAt = new Date().toISOString();
  updateStore((s) => {
    s.guides = guides;
    return s;
  });
  appendAudit({
    action: 'admin.guides.save',
    actor: actor || null,
    meta: { categories: guides.categories.length, items: countItems(guides) },
  });
  return getGuides();
}

export function resetGuides(actor) {
  const guides = cloneGuidesDefaults();
  guides.updatedAt = new Date().toISOString();
  updateStore((s) => {
    s.guides = guides;
    return s;
  });
  appendAudit({
    action: 'admin.guides.reset',
    actor: actor || null,
  });
  return getGuides();
}
