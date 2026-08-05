import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { config } from '../config/index.js';

export function listDownloads() {
  const items = readStore().downloads.sort((a, b) => a.order - b.order);
  return items.map((d) => ({
    ...d,
    url: d.url || (d.type === 'client' ? config.server.downloadUrl : d.url),
  }));
}

export function upsertDownload(payload, adminUsername) {
  let saved = null;
  updateStore((s) => {
    if (payload.id) {
      const idx = s.downloads.findIndex((d) => d.id === payload.id);
      if (idx >= 0) {
        s.downloads[idx] = { ...s.downloads[idx], ...payload };
        saved = s.downloads[idx];
        return s;
      }
    }
    saved = {
      id: payload.id || `${Date.now()}`,
      title: payload.title,
      description: payload.description || '',
      url: payload.url || '',
      size: payload.size || '—',
      type: payload.type || 'tools',
      order: payload.order ?? s.downloads.length + 1,
    };
    s.downloads.push(saved);
    return s;
  });
  appendAudit({
    action: 'admin.downloads.upsert',
    username: adminUsername,
    meta: { id: saved.id },
  });
  return saved;
}
