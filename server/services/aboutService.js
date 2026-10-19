import { readStore, updateStore, appendAudit } from '../data/cmsStore.js';
import { cloneAboutDefaults } from '../data/aboutDefaults.js';
import { config } from '../config/index.js';

function normalizeAbout(raw) {
  const base = cloneAboutDefaults();
  if (!raw || typeof raw !== 'object') return base;
  const sections = Array.isArray(raw.sections) ? raw.sections : base.sections;
  return {
    updatedAt: raw.updatedAt || null,
    sections: sections
      .filter((s) => s && s.id)
      .map((s) => ({
        id: String(s.id),
        title: normalizeText(s.title, s.id),
        rows: Array.isArray(s.rows)
          ? s.rows
              .filter((r) => r && (r.label || r.value != null))
              .map((r) => ({
                label: normalizeText(r.label, ''),
                value: r.value == null ? '' : String(r.value),
              }))
          : [],
      })),
  };
}

function normalizeText(value, fallback) {
  if (value && typeof value === 'object') {
    return {
      es: String(value.es ?? fallback ?? ''),
      en: String(value.en ?? value.es ?? fallback ?? ''),
      pt: String(value.pt ?? value.en ?? value.es ?? fallback ?? ''),
    };
  }
  const t = value == null ? String(fallback ?? '') : String(value);
  return { es: t, en: t, pt: t };
}

/** Keep headline rates in sync with CMS server settings when keys match. */
function applyLiveServerOverlay(about) {
  const live = {
    'Nombre del server': config.server.name,
    'Server name': config.server.name,
    Versión: `Season ${config.server.season}`,
    Version: `Season ${config.server.season}`,
    'EXP regular': config.server.exp,
    'Regular EXP': config.server.exp,
    'EXP Master': config.server.masterExp,
    'Master EXP': config.server.masterExp,
    Drop: config.server.drop,
  };
  const sections = about.sections.map((section) => {
    if (section.id !== 'general') return section;
    return {
      ...section,
      rows: section.rows.map((row) => {
        const keys = [row.label?.es, row.label?.en, row.label?.pt].filter(Boolean);
        for (const k of keys) {
          if (live[k] != null && live[k] !== '') {
            return { ...row, value: String(live[k]) };
          }
        }
        return row;
      }),
    };
  });
  return { ...about, sections };
}

export function getAbout({ applyLive = true } = {}) {
  const store = readStore();
  const about = normalizeAbout(store.about);
  return applyLive ? applyLiveServerOverlay(about) : about;
}

export function saveAbout(payload, actor) {
  const about = normalizeAbout(payload);
  about.updatedAt = new Date().toISOString();
  updateStore((s) => {
    s.about = about;
    return s;
  });
  appendAudit({
    action: 'admin.about.save',
    actor: actor || null,
    meta: { sections: about.sections.length },
  });
  return getAbout({ applyLive: false });
}

export function resetAbout(actor) {
  const about = cloneAboutDefaults();
  about.updatedAt = new Date().toISOString();
  updateStore((s) => {
    s.about = about;
    return s;
  });
  appendAudit({
    action: 'admin.about.reset',
    actor: actor || null,
  });
  return getAbout({ applyLive: false });
}
