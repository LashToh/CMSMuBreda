import DOMPurify from 'dompurify';
import { looksLikeHtml, markdownToHtml } from './markdownBlocks';

export { looksLikeHtml, markdownToHtml };

const YT_HOSTS = ['www.youtube-nocookie.com', 'www.youtube.com'];
const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;
const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9._-]+$/;

/** Accepts watch?v=, youtu.be/, shorts/, embed/ links. Returns the video id or null. */
export function parseYoutubeId(input) {
  let url;
  try {
    url = new URL(String(input || '').trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const host = url.hostname.toLowerCase();
  let id = null;
  if (host === 'youtu.be') {
    id = url.pathname.split('/')[1];
  } else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'www.youtube-nocookie.com'].includes(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['shorts', 'embed', 'live', 'v'].includes(parts[0])) id = parts[1];
  }
  return id && YT_ID.test(id) ? id : null;
}

export function normalizeYoutubeEmbed(src) {
  try {
    const u = new URL(String(src || '').trim());
    if (u.protocol !== 'https:' || !YT_HOSTS.includes(u.hostname)) return null;
    const m = u.pathname.match(/^\/embed\/([A-Za-z0-9_-]{6,20})\/?$/);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  } catch {
    return null;
  }
}

export function isAllowedImageSrc(src) {
  const value = String(src || '').trim();
  if (UPLOAD_PATH.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && Boolean(u.hostname);
  } catch {
    return false;
  }
}

let hooked = false;
function ensureHooks() {
  if (hooked) return;
  hooked = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const tag = node.tagName;
    if (tag === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^https?:/i.test(href)) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      } else if (!/^mailto:/i.test(href)) {
        node.removeAttribute('href');
        node.removeAttribute('target');
        node.removeAttribute('rel');
      }
    }
    if (tag === 'IMG' && !isAllowedImageSrc(node.getAttribute('src'))) {
      node.remove();
      return;
    }
    if (tag === 'IFRAME') {
      const src = normalizeYoutubeEmbed(node.getAttribute('src'));
      if (!src) {
        node.remove();
        return;
      }
      node.setAttribute('src', src);
      node.setAttribute('allow', 'fullscreen; picture-in-picture');
      node.setAttribute('loading', 'lazy');
    }
    if (node.hasAttribute && node.hasAttribute('style')) {
      const m = /text-align\s*:\s*(left|right|center|justify)/i.exec(node.getAttribute('style') || '');
      if (m) node.setAttribute('style', `text-align: ${m[1].toLowerCase()}`);
      else node.removeAttribute('style');
    }
  });
}

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'iframe',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'colspan', 'rowspan', 'style',
    'data-youtube-video', 'allowfullscreen', 'frameborder', 'allow', 'loading',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/uploads\/)/i,
};

/** Sanitize rich guide HTML for display (same allowlist as the server). */
export function sanitizeGuideHtml(html) {
  ensureHooks();
  return String(DOMPurify.sanitize(String(html || ''), PURIFY_CONFIG));
}

/** Legacy markdown -> HTML (HTML values are returned as they are). */
export function toHtml(value) {
  const text = value == null ? '' : String(value);
  return looksLikeHtml(text) ? text : markdownToHtml(text);
}

function htmlifyText(text) {
  const t = text || {};
  return { es: toHtml(t.es), en: toHtml(t.en), pt: toHtml(t.pt) };
}

/** Converts intro and bodies of a guides object to HTML (for the editor). */
export function htmlifyGuides(data) {
  if (!data) return data;
  return {
    ...data,
    intro: htmlifyText(data.intro),
    categories: (data.categories || []).map((cat) => ({
      ...cat,
      items: (cat.items || []).map((item) => ({ ...item, body: htmlifyText(item.body) })),
    })),
  };
}
