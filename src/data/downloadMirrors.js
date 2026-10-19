/** Shared mirror providers for client downloads. */
export const MIRROR_PROVIDERS = [
  { id: 'direct', label: 'Direct Download' },
  { id: 'mega', label: 'Mega' },
  { id: 'googleDrive', label: 'Google Drive' },
  { id: 'mediafire', label: 'MediaFire' },
];

export function emptyMirror(id) {
  const meta = MIRROR_PROVIDERS.find((p) => p.id === id);
  return {
    id,
    label: meta?.label || id,
    description: '',
    url: '',
    size: '',
  };
}

export function emptyMirrorsMap() {
  return Object.fromEntries(MIRROR_PROVIDERS.map((p) => [p.id, emptyMirror(p.id)]));
}

/**
 * Normalize API/store mirrors.
 * Supports legacy `{ direct: 'https://...' }` and rich `{ direct: { url, label, ... } }`.
 */
export function normalizeMirrorsMap(item = {}) {
  const raw = item.mirrors && typeof item.mirrors === 'object' ? item.mirrors : {};
  const map = emptyMirrorsMap();

  for (const provider of MIRROR_PROVIDERS) {
    const value = raw[provider.id];
    if (typeof value === 'string') {
      map[provider.id] = {
        ...emptyMirror(provider.id),
        url: value.trim(),
      };
    } else if (value && typeof value === 'object') {
      map[provider.id] = {
        id: provider.id,
        label: String(value.label || provider.label).trim() || provider.label,
        description: String(value.description || '').trim(),
        url: String(value.url || '').trim(),
        size: String(value.size || '').trim(),
      };
    }
  }

  // Legacy single URL → direct
  if (!map.direct.url && item.url) {
    map.direct.url = String(item.url).trim();
  }

  return map;
}

/** Mirrors that have a URL, ready for UI rendering. */
export function mirrorsWithUrls(item, { fallbackSize = '' } = {}) {
  const map = normalizeMirrorsMap(item);
  return MIRROR_PROVIDERS.map((p) => {
    const m = map[p.id];
    return {
      id: m.id,
      label: m.label || p.label,
      description: m.description || '',
      url: m.url || '',
      size: m.size || fallbackSize || '',
    };
  }).filter((m) => Boolean(m.url));
}
