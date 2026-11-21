import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { AppError } from '../utils/errors.js';
import { NEWS_LANGS, translateText } from './translationService.js';

function normLang(value) {
  return NEWS_LANGS.includes(value) ? value : null;
}

const inFlight = new Map();

/** Translates title + content of a news item into `to`, saves it in the store and returns it (or null). */
async function ensureTranslation(item, to) {
  const key = `${item.id}:${to}`;
  if (inFlight.has(key)) return inFlight.get(key);
  const job = (async () => {
    const from = normLang(item.lang) || 'es';
    const title = await translateText(item.title, from, to);
    if (title === null) return null;
    const content = await translateText(item.content, from, to);
    if (content === null) return null;
    updateStore((s) => {
      const target = s.news.find((n) => n.id === item.id);
      // Only save if the post was not edited meanwhile.
      if (target && target.title === item.title && target.content === item.content && (normLang(target.lang) || 'es') === from) {
        target.translations = { ...(target.translations || {}), [to]: { title, content } };
      }
      return s;
    });
    return { title, content };
  })().finally(() => inFlight.delete(key));
  inFlight.set(key, job);
  return job;
}

/** Returns the item in `lang` (translating and caching it on first request); the original if that fails. */
async function localize(item, lang) {
  const target = normLang(lang);
  const original = normLang(item.lang) || 'es';
  const { translations, ...rest } = item;
  const base = { ...rest, lang: original };
  if (!target || target === original) return base;
  const saved = translations?.[target];
  if (saved?.title && saved?.content) return { ...base, title: saved.title, content: saved.content };
  try {
    const fresh = await ensureTranslation(item, target);
    if (fresh) return { ...base, title: fresh.title, content: fresh.content };
  } catch {
    /* fall back to the original text */
  }
  return base;
}

export async function listNews({ type, lang } = {}) {
  let items = readStore().news.filter((n) => n.published !== false);
  if (type) items = items.filter((n) => n.type === type);
  items = items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Promise.all(items.map((n) => localize(n, lang)));
}

export async function getNews(id, lang) {
  const item = readStore().news.find((n) => n.id === id && n.published !== false);
  if (!item) throw new AppError('News not found.', { status: 404, code: 'NOT_FOUND' });
  return localize(item, lang);
}

export function createNews(payload, adminUsername) {
  const item = {
    id: `${Date.now()}`,
    type: payload.type || 'news',
    title: payload.title,
    author: payload.author || adminUsername || 'Staff',
    content: payload.content,
    lang: normLang(payload.lang) || 'es',
    createdAt: new Date().toISOString(),
    published: payload.published !== false,
  };
  updateStore((s) => {
    s.news.unshift(item);
    return s;
  });
  appendAudit({ action: 'admin.news.create', username: adminUsername, meta: { id: item.id } });
  // Translate in the background so the first reader does not wait.
  for (const to of NEWS_LANGS.filter((l) => l !== item.lang)) {
    ensureTranslation(item, to).catch(() => {});
  }
  return item;
}

export function updateNews(id, payload, adminUsername) {
  let updated = null;
  updateStore((s) => {
    const idx = s.news.findIndex((n) => n.id === id);
    if (idx === -1) throw new AppError('News not found.', { status: 404, code: 'NOT_FOUND' });
    const prev = s.news[idx];
    const { translations: _ignored, ...clean } = payload || {};
    const next = { ...prev, ...clean, id };
    if (clean.lang !== undefined) next.lang = normLang(clean.lang) || normLang(prev.lang) || 'es';
    const changed =
      next.title !== prev.title || next.content !== prev.content || (normLang(next.lang) || 'es') !== (normLang(prev.lang) || 'es');
    if (changed) delete next.translations;
    s.news[idx] = next;
    updated = next;
    return s;
  });
  appendAudit({ action: 'admin.news.update', username: adminUsername, meta: { id } });
  return updated;
}

export function deleteNews(id, adminUsername) {
  updateStore((s) => {
    s.news = s.news.filter((n) => n.id !== id);
    return s;
  });
  appendAudit({ action: 'admin.news.delete', username: adminUsername, meta: { id } });
  return { deleted: true };
}
