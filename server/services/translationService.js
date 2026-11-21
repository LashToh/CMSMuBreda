export const NEWS_LANGS = ['es', 'en', 'pt'];

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';
const TIMEOUT_MS = 6000;

async function translateChunk(text, from, to) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: new URLSearchParams({ client: 'gtx', sl: from, tl: to, dt: 't', q: text }).toString(),
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = data[0].map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : '')).join('');
    return out || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translates `text` with the public Google Translate endpoint (no key).
 * Line breaks are kept (each non-empty line is translated on its own).
 * Returns null on any failure: callers must fall back to the original text.
 */
export async function translateText(text, from, to) {
  if (typeof text !== 'string' || !text.trim()) return text || '';
  if (from === to) return text;
  const lines = text.split('\n');
  const out = [];
  for (const line of lines) {
    if (!line.trim()) {
      out.push(line);
      continue;
    }
    const tr = await translateChunk(line, from, to);
    if (tr === null) return null;
    out.push(tr.replace(/\r?\n$/, ''));
  }
  return out.join('\n');
}
