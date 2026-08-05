import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { AppError } from '../utils/errors.js';

export function listNews({ type } = {}) {
  let items = readStore().news.filter((n) => n.published !== false);
  if (type) items = items.filter((n) => n.type === type);
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getNews(id) {
  const item = readStore().news.find((n) => n.id === id && n.published !== false);
  if (!item) throw new AppError('News not found.', { status: 404, code: 'NOT_FOUND' });
  return item;
}

export function createNews(payload, adminUsername) {
  const item = {
    id: `${Date.now()}`,
    type: payload.type || 'news',
    title: payload.title,
    author: payload.author || adminUsername || 'Staff',
    content: payload.content,
    createdAt: new Date().toISOString(),
    published: payload.published !== false,
  };
  updateStore((s) => {
    s.news.unshift(item);
    return s;
  });
  appendAudit({ action: 'admin.news.create', username: adminUsername, meta: { id: item.id } });
  return item;
}

export function updateNews(id, payload, adminUsername) {
  let updated = null;
  updateStore((s) => {
    const idx = s.news.findIndex((n) => n.id === id);
    if (idx === -1) throw new AppError('News not found.', { status: 404, code: 'NOT_FOUND' });
    s.news[idx] = { ...s.news[idx], ...payload, id };
    updated = s.news[idx];
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
