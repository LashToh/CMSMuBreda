import sanitizeHtml from 'sanitize-html';

/**
 * Sanitizer for guide bodies (rich text from the AdminCP editor).
 * Allowlist only: no scripts, no event handlers, no javascript: URLs, iframes only for YouTube
 * (always rewritten to youtube-nocookie.com), images only from /uploads or https.
 */

const YT_HOSTS = ['www.youtube-nocookie.com', 'www.youtube.com'];
const YT_EMBED_PATH = /^\/embed\/([A-Za-z0-9_-]{6,20})\/?$/;
const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9._-]+$/;
const ALIGN = /^(left|right|center|justify)$/;

/** Returns the nocookie embed URL for a YouTube embed URL, or null if it is not one. */
export function normalizeYoutubeEmbed(src) {
  try {
    const u = new URL(String(src || '').trim());
    if (u.protocol !== 'https:' || !YT_HOSTS.includes(u.hostname)) return null;
    const m = u.pathname.match(YT_EMBED_PATH);
    return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
  } catch {
    return null;
  }
}

/** Images: /uploads/<file> or an absolute https URL. */
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

function dimension(value) {
  const v = String(value || '').trim();
  return /^\d{1,4}$/.test(v) ? v : undefined;
}

const STYLE_TAGS = ['p', 'h3', 'h4', 'li', 'blockquote', 'th', 'td'];

const OPTIONS = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h3', 'h4', 'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'iframe',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'width', 'height'],
    th: ['colspan', 'rowspan', 'style'],
    td: ['colspan', 'rowspan', 'style'],
    div: ['data-youtube-video'],
    iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow'],
    p: ['style'],
    h3: ['style'],
    h4: ['style'],
    li: ['style'],
    blockquote: ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [ALIGN] },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  allowedIframeHostnames: YT_HOSTS,
  disallowedTagsMode: 'discard',
  transformTags: {
    a: (tagName, attribs) => {
      const href = String(attribs.href || '').trim();
      if (!/^(https?:|mailto:)/i.test(href)) return { tagName: 'a', attribs: {} };
      if (/^mailto:/i.test(href)) return { tagName: 'a', attribs: { href } };
      return { tagName: 'a', attribs: { href, target: '_blank', rel: 'noopener noreferrer' } };
    },
    img: (tagName, attribs) => {
      if (!isAllowedImageSrc(attribs.src)) return { tagName: 'img', attribs: {} };
      const out = { src: String(attribs.src).trim(), alt: String(attribs.alt || '').slice(0, 300) };
      const w = dimension(attribs.width);
      const h = dimension(attribs.height);
      if (w) out.width = w;
      if (h) out.height = h;
      return { tagName: 'img', attribs: out };
    },
    iframe: (tagName, attribs) => {
      const src = normalizeYoutubeEmbed(attribs.src);
      if (!src) return { tagName: 'iframe', attribs: {} };
      const out = { src, allowfullscreen: 'true', frameborder: '0', allow: 'fullscreen; picture-in-picture' };
      const w = dimension(attribs.width);
      const h = dimension(attribs.height);
      if (w) out.width = w;
      if (h) out.height = h;
      return { tagName: 'iframe', attribs: out };
    },
  },
  // Drop images / iframes whose source was rejected, and empty links stay as plain text.
  exclusiveFilter: (frame) =>
    (frame.tag === 'img' && !frame.attribs.src) || (frame.tag === 'iframe' && !frame.attribs.src),
};

/** True when the stored value is HTML (starts with a tag). Anything else is legacy markdown. */
export function looksLikeHtml(value) {
  return /^\s*</.test(String(value || ''));
}

/** Sanitize HTML. Legacy markdown (does not start with "<") is returned untouched: the front renders it as text. */
export function sanitizeGuideHtml(value) {
  const text = value == null ? '' : String(value);
  if (!looksLikeHtml(text)) return text;
  return sanitizeHtml(text, OPTIONS);
}

export { STYLE_TAGS };
