import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { config } from '../config/index.js';
import { AppError } from '../utils/errors.js';

const MIRROR_KEYS = ['direct', 'mega', 'googleDrive', 'mediafire'];

const DEFAULT_LABELS = {
  direct: 'Direct Download',
  mega: 'Mega',
  googleDrive: 'Google Drive',
  mediafire: 'MediaFire',
};

function emptyMirror(id) {
  return {
    id,
    label: DEFAULT_LABELS[id] || id,
    description: '',
    url: '',
    size: '',
  };
}

function normalizeOneMirror(id, value) {
  const base = emptyMirror(id);
  if (typeof value === 'string') {
    return { ...base, url: value.trim() };
  }
  if (value && typeof value === 'object') {
    return {
      id,
      label: String(value.label || base.label).trim() || base.label,
      description: String(value.description || '').trim(),
      url: String(value.url || '').trim(),
      size: String(value.size || '').trim(),
    };
  }
  return base;
}

function normalizeMirrors(item = {}) {
  const raw = item.mirrors && typeof item.mirrors === 'object' ? item.mirrors : {};
  const mirrors = {};
  for (const key of MIRROR_KEYS) {
    mirrors[key] = normalizeOneMirror(key, raw[key]);
  }
  if (!mirrors.direct.url && item.url) {
    mirrors.direct.url = String(item.url).trim();
  }
  return mirrors;
}

function enrichDownload(item) {
  const mirrors = normalizeMirrors(item);
  if (item.type === 'client' && !mirrors.direct.url && config.server.downloadUrl) {
    mirrors.direct.url = String(config.server.downloadUrl).trim();
  }
  return {
    ...item,
    description: item.description || '',
    size: item.size || '',
    mirrors,
    url: mirrors.direct.url || item.url || '',
  };
}

export function listDownloads() {
  const items = readStore().downloads.sort((a, b) => a.order - b.order);
  return items.map(enrichDownload);
}

export function upsertDownload(payload, adminUsername) {
  let saved = null;
  const mirrors = normalizeMirrors({
    url: payload.url,
    mirrors: payload.mirrors,
  });

  updateStore((s) => {
    const next = {
      title: String(payload.title || '').trim(),
      description: String(payload.description ?? '').trim(),
      size: String(payload.size ?? '').trim(),
      url: mirrors.direct.url,
      mirrors,
      type: payload.type || 'tools',
      order: payload.order,
    };

    if (payload.id) {
      const idx = s.downloads.findIndex((d) => d.id === payload.id);
      if (idx >= 0) {
        s.downloads[idx] = {
          ...s.downloads[idx],
          ...next,
          order: payload.order ?? s.downloads[idx].order,
        };
        saved = s.downloads[idx];
        return s;
      }
    }

    saved = {
      id: payload.id || `${Date.now()}`,
      ...next,
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
  return enrichDownload(saved);
}

export function deleteDownload(id, adminUsername) {
  let found = false;
  updateStore((s) => {
    const before = s.downloads.length;
    s.downloads = s.downloads.filter((d) => d.id !== id);
    found = s.downloads.length < before;
    return s;
  });
  if (!found) {
    throw new AppError('Download not found.', { status: 404, code: 'NOT_FOUND' });
  }
  appendAudit({
    action: 'admin.downloads.delete',
    username: adminUsername,
    meta: { id },
  });
  return { deleted: true };
}
